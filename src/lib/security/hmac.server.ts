/**
 * Shopify HMAC verification for webhooks + App Proxy requests.
 *
 * Shopify signs the raw request body with the app secret and sends
 * base64 in the X-Shopify-Hmac-Sha256 header. Compare with a
 * timing-safe equal check.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyShopifyWebhook(
  rawBody: string | Buffer,
  hmacHeader: string | null,
  secret: string,
): boolean {
  if (!hmacHeader || !secret) return false;
  const digest = createHmac("sha256", secret).update(rawBody).digest("base64");
  const a = Buffer.from(digest, "utf8");
  const b = Buffer.from(hmacHeader, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Verify a Shopify Admin OAuth redirect / App Proxy query-string HMAC.
 * The `hmac` parameter is removed and the remaining params are
 * lexicographically sorted before HMAC-SHA256 hex.
 */
export function verifyShopifyQuery(
  query: URLSearchParams,
  secret: string,
): boolean {
  const hmac = query.get("hmac");
  if (!hmac || !secret) return false;
  const params = new URLSearchParams(query);
  params.delete("hmac");
  params.delete("signature");
  const message = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  const digest = createHmac("sha256", secret).update(message).digest("hex");
  const a = Buffer.from(digest, "utf8");
  const b = Buffer.from(hmac, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
