/**
 * GET /api/public/shopify/auth/callback
 *
 * Shopify redirects here after the merchant approves the OAuth consent.
 * We must:
 *   1. Verify HMAC of the query string (proves Shopify sent it).
 *   2. Verify the `state` nonce we minted at /install (blocks CSRF).
 *   3. Verify the `shop` is a valid *.myshopify.com host.
 *   4. Exchange `code` for a permanent offline access token.
 *   5. Fetch shop metadata via Admin API.
 *   6. Upsert into public.shops with an encrypted token.
 *   7. Register mandatory webhooks (app/uninstalled, GDPR topics).
 *   8. Redirect the merchant back into the embedded admin.
 */
import { createFileRoute } from "@tanstack/react-router";
import { verifyShopifyQuery } from "@/lib/security/hmac.server";
import { isValidShopDomain, normalizeShopDomain } from "@/lib/services/shopify/shop-domain.server";
import { encryptToken } from "@/lib/security/token-crypto.server";
import { ShopifyAdminClient } from "@/lib/services/shopify/admin-client.server";
import { rateLimit } from "@/lib/security/rate-limit.server";
import { logger } from "@/lib/logger";

const SHOP_QUERY = /* GraphQL */ `
  query Shop {
    shop {
      id
      name
      email
      myshopifyDomain
      currencyCode
      ianaTimezone
      billingAddress { countryCodeV2 }
      plan { displayName }
    }
  }
`;

const REGISTER_WEBHOOK = /* GraphQL */ `
  mutation WebhookCreate($topic: WebhookSubscriptionTopic!, $callbackUrl: URL!) {
    webhookSubscriptionCreate(
      topic: $topic
      webhookSubscription: { callbackUrl: $callbackUrl, format: JSON }
    ) {
      userErrors { field message }
    }
  }
`;

interface WebhookRegistration {
  topic: string;
  path: string;
}

const MANDATORY_WEBHOOKS: WebhookRegistration[] = [
  { topic: "APP_UNINSTALLED",           path: "/api/public/shopify/webhooks/app-uninstalled" },
  { topic: "APP_SUBSCRIPTIONS_UPDATE",  path: "/api/public/shopify/webhooks/app-subscriptions-update" },
  { topic: "PRODUCTS_UPDATE",           path: "/api/public/shopify/webhooks/products-update" },
  { topic: "COLLECTIONS_UPDATE",        path: "/api/public/shopify/webhooks/collections-update" },
  { topic: "CUSTOMERS_DATA_REQUEST",    path: "/api/public/shopify/webhooks/customers-data-request" },
  { topic: "CUSTOMERS_REDACT",          path: "/api/public/shopify/webhooks/customers-redact" },
  { topic: "SHOP_REDACT",               path: "/api/public/shopify/webhooks/shop-redact" },
];

export const Route = createFileRoute("/api/public/shopify/auth/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "unknown";
        try {
          rateLimit({ key: `shopify:callback:${ip}`, max: 60, windowMs: 60_000 });
        } catch {
          return new Response("Too many requests", { status: 429 });
        }

        const apiKey = process.env.SHOPIFY_API_KEY;
        const apiSecret = process.env.SHOPIFY_API_SECRET;
        const appUrl = process.env.SHOPIFY_APP_URL;
        if (!apiKey || !apiSecret || !appUrl) {
          return new Response("Shopify app not configured", { status: 503 });
        }

        // 1) HMAC of query params.
        if (!verifyShopifyQuery(url.searchParams, apiSecret)) {
          logger.warn("shopify.callback.hmac_invalid");
          return new Response("Invalid HMAC", { status: 401 });
        }

        // 2) Shop domain.
        const shopRaw = url.searchParams.get("shop");
        const shop = shopRaw ? normalizeShopDomain(shopRaw) : "";
        if (!isValidShopDomain(shop)) {
          return new Response("Invalid shop", { status: 400 });
        }

        // 3) State nonce.
        const state = url.searchParams.get("state") ?? "";
        const code = url.searchParams.get("code") ?? "";
        if (!state || !code) {
          return new Response("Missing state or code", { status: 400 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: stateRow, error: stateErr } = await supabaseAdmin
          .from("shop_oauth_states")
          .select("state, shop_domain, expires_at")
          .eq("state", state)
          .maybeSingle();
        if (stateErr) {
          logger.error("shopify.callback.state_lookup_failed", { message: stateErr.message });
          return new Response("Server error", { status: 500 });
        }
        if (!stateRow || stateRow.shop_domain !== shop) {
          logger.warn("shopify.callback.state_mismatch", { shop });
          return new Response("Invalid state", { status: 401 });
        }
        if (new Date(stateRow.expires_at).getTime() < Date.now()) {
          return new Response("State expired — restart install", { status: 401 });
        }
        // One-shot: burn the nonce.
        await supabaseAdmin.from("shop_oauth_states").delete().eq("state", state);

        // 4) Exchange the code for an offline access token.
        const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: apiKey,
            client_secret: apiSecret,
            code,
          }),
        });
        if (!tokenRes.ok) {
          const body = await tokenRes.text().catch(() => "");
          logger.error("shopify.callback.token_exchange_failed", {
            status: tokenRes.status, body: body.slice(0, 200),
          });
          return new Response("Token exchange failed", { status: 502 });
        }
        const tokenBody = (await tokenRes.json()) as {
          access_token: string;
          scope: string;
        };
        if (!tokenBody.access_token) {
          return new Response("No access_token in response", { status: 502 });
        }

        // 5) Fetch shop details.
        const admin = new ShopifyAdminClient({
          shopifyDomain: shop,
          accessToken: tokenBody.access_token,
        });
        let shopData: {
          shop: {
            id: string;
            name: string;
            email: string;
            myshopifyDomain: string;
            currencyCode: string;
            ianaTimezone: string;
            billingAddress?: { countryCodeV2: string | null } | null;
            plan?: { displayName: string | null } | null;
          };
        };
        try {
          shopData = await admin.graphql(SHOP_QUERY);
        } catch (err) {
          logger.error("shopify.callback.shop_fetch_failed", {
            message: err instanceof Error ? err.message : String(err),
          });
          return new Response("Could not fetch shop details", { status: 502 });
        }
        const s = shopData.shop;

        // 6) Upsert shop row with encrypted token.
        const nowIso = new Date().toISOString();
        const { error: upsertErr } = await supabaseAdmin
          .from("shops")
          .upsert(
            {
              shopify_domain: shop,
              shopify_shop_id: s.id,
              name: s.name,
              email: s.email,
              currency: s.currencyCode,
              timezone: s.ianaTimezone,
              country_code: s.billingAddress?.countryCodeV2 ?? null,
              plan_name: s.plan?.displayName ?? null,
              access_token_encrypted: encryptToken(tokenBody.access_token),
              scopes: tokenBody.scope,
              installed_at: nowIso,
              uninstalled_at: null,
              updated_at: nowIso,
            },
            { onConflict: "shopify_domain" },
          );
        if (upsertErr) {
          logger.error("shopify.callback.shop_upsert_failed", { message: upsertErr.message });
          return new Response("Could not persist shop", { status: 500 });
        }

        // 7) Register mandatory webhooks (idempotent — Shopify rejects dupes
        //    with a userError we ignore).
        const publicUrl = appUrl.replace(/\/$/, "");
        for (const wh of MANDATORY_WEBHOOKS) {
          try {
            const res = await admin.graphql<{
              webhookSubscriptionCreate: { userErrors: Array<{ message: string; field?: string[] }> };
            }>(REGISTER_WEBHOOK, {
              topic: wh.topic,
              callbackUrl: `${publicUrl}${wh.path}`,
            });
            const errs = res.webhookSubscriptionCreate.userErrors ?? [];
            for (const e of errs) {
              // "for this topic and address" ⇒ already registered.
              if (!/already been taken|already exists/i.test(e.message)) {
                logger.warn("shopify.callback.webhook_register_warning", {
                  topic: wh.topic, message: e.message,
                });
              }
            }
          } catch (err) {
            logger.warn("shopify.callback.webhook_register_failed", {
              topic: wh.topic,
              message: err instanceof Error ? err.message : String(err),
            });
          }
        }

        // 8) Return the merchant into the embedded admin.
        const storeHandle = shop.slice(0, -".myshopify.com".length);
        const target = `https://admin.shopify.com/store/${encodeURIComponent(storeHandle)}/apps/${apiKey}`;
        return Response.redirect(target, 302);
      },
    },
  },
});
