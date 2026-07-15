/**
 * Server-side helpers for resolving the current Shopify shop from a request.
 *
 * Two paths:
 *   1. Embedded App requests carry a Shopify session token in the
 *      `Authorization: Bearer <JWT>` header (issued by App Bridge). Verified
 *      locally against SHOPIFY_API_SECRET.
 *   2. During OAuth callback we look up by `shop_domain`.
 *
 * Both return a `ShopContext` containing the shop row + a ready
 * `ShopifyAdminClient` with the decrypted offline token.
 */
import { UnauthorizedError, NotFoundError } from "@/lib/errors";
import { verifySessionToken } from "./session.server";
import { ShopifyAdminClient } from "./admin-client.server";
import { decryptToken } from "@/lib/security/token-crypto.server";

export interface ShopRow {
  id: string;
  shopify_domain: string;
  name: string;
  access_token_encrypted: string | null;
  scopes: string | null;
  uninstalled_at: string | null;
}

export interface ShopContext {
  shop: ShopRow;
  admin: ShopifyAdminClient;
  accessToken: string;
}

async function loadShopByDomain(domain: string): Promise<ShopRow | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("shops")
    .select("id, shopify_domain, name, access_token_encrypted, scopes, uninstalled_at")
    .eq("shopify_domain", domain)
    .maybeSingle();
  if (error) throw error;
  return data as ShopRow | null;
}

function contextFromShop(shop: ShopRow): ShopContext {
  if (shop.uninstalled_at) {
    throw new UnauthorizedError("App was uninstalled from this shop");
  }
  if (!shop.access_token_encrypted) {
    throw new UnauthorizedError("Shop has no access token — reinstall required");
  }
  const accessToken = decryptToken(shop.access_token_encrypted);
  const admin = new ShopifyAdminClient({
    shopifyDomain: shop.shopify_domain,
    accessToken,
  });
  return { shop, admin, accessToken };
}

/** Resolve shop by domain (used in webhook handlers and OAuth callback). */
export async function getShopContextByDomain(domain: string): Promise<ShopContext> {
  const shop = await loadShopByDomain(domain);
  if (!shop) throw new NotFoundError(`Unknown shop: ${domain}`);
  return contextFromShop(shop);
}

/**
 * Resolve shop from an embedded-admin session token.
 * Returns null when no token is present (caller may fall back to dev mode).
 */
export async function getShopContextFromRequest(
  request: Request,
): Promise<ShopContext | null> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice("Bearer ".length).trim();
  // A Shopify session token is a JWT (3 dot-separated segments). Anything
  // else is a Supabase bearer that another middleware handles.
  if (token.split(".").length !== 3) return null;
  let claims;
  try {
    claims = verifySessionToken(token);
  } catch {
    return null;
  }
  // dest looks like `https://acme.myshopify.com`
  const dest = new URL(claims.dest);
  const domain = dest.host.toLowerCase();
  return getShopContextByDomain(domain);
}

/** Throws UnauthorizedError when no valid session token is present. */
export async function requireShopContext(request: Request): Promise<ShopContext> {
  const ctx = await getShopContextFromRequest(request);
  if (!ctx) throw new UnauthorizedError("No Shopify session token");
  return ctx;
}
