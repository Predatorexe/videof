/**
 * Validate a `shop` parameter is a legitimate Shopify domain.
 * Only accepts `<name>.myshopify.com` with a safe subdomain — this is the
 * one-and-only guard against open-redirect / SSRF via the install URL.
 */
const SHOP_RE = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i;

export function isValidShopDomain(shop: string | null | undefined): shop is string {
  if (!shop || typeof shop !== "string") return false;
  if (shop.length > 255) return false;
  return SHOP_RE.test(shop);
}

export function normalizeShopDomain(shop: string): string {
  return shop.trim().toLowerCase();
}
