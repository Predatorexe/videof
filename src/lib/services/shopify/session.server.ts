/**
 * Shopify session token (JWT) verification.
 *
 * When a shop is embedded via App Bridge, every authenticated fetch from the
 * embedded frontend carries a session token in the Authorization header. It
 * is a JWT signed with the app's API secret (HS256). Verify locally — no
 * network call.
 *
 * NOTE: implementation is production-shaped but requires SHOPIFY_API_SECRET
 * to be provisioned in Cloud secrets before it can be exercised.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { UnauthorizedError } from "@/lib/errors";
import { serverEnv } from "@/lib/env";

export interface ShopifySessionClaims {
  iss: string;   // https://{shop}.myshopify.com/admin
  dest: string;  // https://{shop}.myshopify.com
  aud: string;   // API key
  sub: string;   // user id
  exp: number;
  nbf: number;
  iat: number;
  jti: string;
  sid: string;
}

function base64UrlDecode(input: string): string {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  return Buffer.from(
    input.replace(/-/g, "+").replace(/_/g, "/") + pad,
    "base64",
  ).toString("utf8");
}

export function verifySessionToken(token: string): ShopifySessionClaims {
  const env = serverEnv();
  if (!env.SHOPIFY_API_SECRET || !env.SHOPIFY_API_KEY) {
    throw new UnauthorizedError("Shopify credentials not configured");
  }
  const parts = token.split(".");
  if (parts.length !== 3) throw new UnauthorizedError("Malformed session token");
  const [headerB64, payloadB64, signatureB64] = parts;

  const expected = createHmac("sha256", env.SHOPIFY_API_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest("base64")
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const a = Buffer.from(expected);
  const b = Buffer.from(signatureB64);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new UnauthorizedError("Invalid session token signature");
  }
  const claims = JSON.parse(base64UrlDecode(payloadB64)) as ShopifySessionClaims;
  const now = Math.floor(Date.now() / 1000);
  if (claims.exp < now) throw new UnauthorizedError("Session token expired");
  if (claims.nbf > now) throw new UnauthorizedError("Session token not yet valid");
  if (claims.aud !== env.SHOPIFY_API_KEY) throw new UnauthorizedError("Wrong audience");
  return claims;
}
