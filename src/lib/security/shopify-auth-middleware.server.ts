/**
 * Unified auth middleware for embedded server functions.
 *
 * Order of precedence:
 *   1. `X-Shopify-Session-Token` — App Bridge JWT. This is the path the
 *      embedded Shopify admin takes. We verify the token, resolve the shop
 *      from `public.shops`, lazily provision an owner user in
 *      `public.user_roles`, and hand callers an admin Supabase client.
 *      RLS is bypassed by the admin client, so every handler is expected
 *      to scope its queries by shop id (which the existing handlers do).
 *   2. `Authorization: Bearer <supabase-jwt>` — the non-embedded fallback
 *      used by the marketing/standalone dashboard, and by preview tooling.
 *      Verifies the JWT with Supabase and returns a user-scoped client.
 *
 * Provides the same context surface as the previous `requireSupabaseAuth`
 * (`supabase`, `userId`, `claims`) plus `shopId` / `shopDomain` when the
 * caller came in via Shopify.
 */
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { verifyShopifySessionToken } from "@/lib/security/shopify-session-token.server";
import { logger } from "@/lib/logger";

type ServerSupabase = SupabaseClient<Database>;

function isNewSupabaseApiKey(v: string): boolean {
  return v.startsWith("sb_publishable_") || v.startsWith("sb_secret_");
}

function supabaseFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));
    if (
      isNewSupabaseApiKey(key) &&
      headers.get("Authorization") === `Bearer ${key}`
    ) {
      headers.delete("Authorization");
    }
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

async function resolveOwnerUserId(
  admin: ServerSupabase,
  shopId: string,
  shopDomain: string,
): Promise<string> {
  const { data: existing } = await admin
    .from("user_roles")
    .select("user_id, role")
    .eq("shop_id", shopId)
    .order("role", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (existing?.user_id) return existing.user_id;

  const safeSuffix = shopDomain.replace(/\./g, "-");
  const email = `owner+${safeSuffix}@videofy.internal`;

  const adminAuth = (admin as unknown as {
    auth: {
      admin: {
        createUser: (attrs: {
          email: string;
          email_confirm?: boolean;
          user_metadata?: Record<string, unknown>;
        }) => Promise<{ data: { user: { id: string } | null } | null; error: { message: string } | null }>;
        listUsers: () => Promise<{ data: { users: Array<{ id: string; email?: string }> } | null; error: { message: string } | null }>;
      };
    };
  }).auth;

  const created = await adminAuth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { shopify_domain: shopDomain, kind: "shopify_owner" },
  });
  let userId = created.data?.user?.id;

  if (!userId) {
    const alreadyExists =
      created.error?.message && /already|registered|exists/i.test(created.error.message);
    if (created.error && !alreadyExists) {
      throw new Error(`Owner bootstrap failed: ${created.error.message}`);
    }
    const listed = await adminAuth.admin.listUsers();
    userId = listed.data?.users.find((u) => u.email === email)?.id;
  }
  if (!userId) throw new Error("Could not resolve owner user id");

  const { error: roleErr } = await admin
    .from("user_roles")
    .insert({ user_id: userId, shop_id: shopId, role: "owner" as never });
  if (roleErr && !/duplicate|unique/i.test(roleErr.message)) {
    throw new Error(`Owner role bootstrap failed: ${roleErr.message}`);
  }
  return userId;
}

export const requireShopifyOrSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const req = getRequest();
    const shopifyToken = req?.headers.get("x-shopify-session-token") ?? "";

    if (shopifyToken) {
      const apiKey = process.env.SHOPIFY_API_KEY;
      const apiSecret = process.env.SHOPIFY_API_SECRET;
      if (!apiKey || !apiSecret) {
        throw new Error("Shopify app not configured");
      }

      let session;
      try {
        session = await verifyShopifySessionToken(shopifyToken, apiKey, apiSecret);
      } catch (err) {
        logger.warn("auth.shopify_session_invalid", {
          message: err instanceof Error ? err.message : String(err),
        });
        throw new Error("Unauthorized: Invalid Shopify session token");
      }

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: shopRow, error: shopErr } = await supabaseAdmin
        .from("shops")
        .select("id, uninstalled_at")
        .eq("shopify_domain", session.shopDomain)
        .maybeSingle();
      if (shopErr) throw new Error(`Shop lookup failed: ${shopErr.message}`);
      if (!shopRow) throw new Error(`Unauthorized: shop ${session.shopDomain} not installed`);
      if (shopRow.uninstalled_at) throw new Error("Unauthorized: shop uninstalled");

      const ownerUserId = await resolveOwnerUserId(
        supabaseAdmin as unknown as ServerSupabase,
        shopRow.id,
        session.shopDomain,
      );

      return next({
        context: {
          supabase: supabaseAdmin as unknown as ServerSupabase,
          userId: ownerUserId,
          shopId: shopRow.id,
          shopDomain: session.shopDomain,
          claims: {
            ...session.claims,
            sub: ownerUserId,
            shopify_user_id: session.shopifyUserId,
            via: "shopify" as const,
          },
        },
      });
    }

    // Fallback — non-embedded (marketing dashboard / preview / CLI).
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      throw new Error("Supabase environment variables missing");
    }
    const authHeader = req?.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("Unauthorized: No authorization header provided");
    }
    const token = authHeader.slice("Bearer ".length);
    if (!token || token.split(".").length !== 3) {
      throw new Error("Unauthorized: Invalid token");
    }
    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      global: {
        fetch: supabaseFetch(SUPABASE_PUBLISHABLE_KEY),
        headers: { Authorization: `Bearer ${token}` },
      },
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.auth.getClaims(token);
    if (error || !data?.claims?.sub) {
      throw new Error("Unauthorized: Invalid token");
    }
    return next({
      context: {
        supabase,
        userId: data.claims.sub as string,
        shopId: undefined as string | undefined,
        shopDomain: undefined as string | undefined,
        claims: data.claims,
      },
    });
  },
);
