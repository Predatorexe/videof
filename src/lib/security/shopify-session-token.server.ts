/**
 * Shopify App Bridge session-token (JWT) verifier.
 *
 * App Bridge signs session tokens with the app's API secret (HS256) and
 * embeds shop identity in the `dest` claim. Every embedded server call
 * that needs shop context passes the token in `X-Shopify-Session-Token`;
 * this helper validates it and returns the resolved shop domain.
 *
 * Runs on Cloudflare Workers via Web Crypto — no Node buffer / jose /
 * jsonwebtoken dependency.
 */

export interface ShopifySessionClaims {
  iss: string;
  dest: string;
  aud: string;
  sub: string;
  exp: number;
  nbf: number;
  iat: number;
  jti: string;
  sid?: string;
}

export interface VerifiedShopifySession {
  shopDomain: string;
  shopifyUserId: string;
  claims: ShopifySessionClaims;
}

const LEEWAY_SEC = 10;
const SHOP_HOST_RE = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i;

function b64urlToBytes(input: string): Uint8Array {
  const pad = input.length % 4 === 0 ? 0 : 4 - (input.length % 4);
  const b64 = (input + "=".repeat(pad)).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function decodeJson<T>(input: string): T {
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(input))) as T;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function verifyShopifySessionToken(
  token: string,
  apiKey: string,
  apiSecret: string,
): Promise<VerifiedShopifySession> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Malformed session token");
  const [headerB64, payloadB64, sigB64] = parts;

  const header = decodeJson<{ alg?: string; typ?: string }>(headerB64);
  if (header.alg !== "HS256") throw new Error("Unsupported token algorithm");

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(apiSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigActual = new Uint8Array(
    await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(`${headerB64}.${payloadB64}`),
    ),
  );
  if (!timingSafeEqual(sigActual, b64urlToBytes(sigB64))) {
    throw new Error("Invalid session token signature");
  }

  const claims = decodeJson<ShopifySessionClaims>(payloadB64);
  const now = Math.floor(Date.now() / 1000);
  if (typeof claims.exp !== "number" || claims.exp + LEEWAY_SEC < now) {
    throw new Error("Session token expired");
  }
  if (typeof claims.nbf === "number" && claims.nbf - LEEWAY_SEC > now) {
    throw new Error("Session token not yet valid");
  }
  if (claims.aud !== apiKey) {
    throw new Error("Session token audience mismatch");
  }

  let dest: URL;
  try {
    dest = new URL(claims.dest);
  } catch {
    throw new Error("Invalid dest claim");
  }
  const shopDomain = dest.host.toLowerCase();
  if (!SHOP_HOST_RE.test(shopDomain)) {
    throw new Error("Invalid shop domain in dest");
  }

  try {
    const iss = new URL(claims.iss);
    if (iss.host.toLowerCase() !== shopDomain) {
      throw new Error("iss/dest host mismatch");
    }
  } catch {
    throw new Error("Invalid iss claim");
  }

  return {
    shopDomain,
    shopifyUserId: String(claims.sub),
    claims,
  };
}
