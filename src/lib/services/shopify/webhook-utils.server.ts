/**
 * Shared helpers for Shopify webhook handlers.
 * All handlers:
 *   1. Read the raw body
 *   2. Verify the HMAC header with SHOPIFY_WEBHOOK_SECRET
 *   3. Parse JSON
 *   4. Look up the shop and dispatch
 *
 * The privileged supabaseAdmin client is imported dynamically inside
 * the handler — never at module scope of a route file.
 */
import { verifyShopifyWebhook } from "@/lib/security/hmac.server";
import { rateLimit } from "@/lib/security/rate-limit.server";
import { serverEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

export interface VerifiedWebhook<T = unknown> {
  topic: string;
  domain: string;
  payload: T;
}

export async function verifyAndParse<T = unknown>(request: Request): Promise<VerifiedWebhook<T> | Response> {
  const env = serverEnv();
  // Shopify signs webhooks with the app's API secret by default. A dedicated
  // SHOPIFY_WEBHOOK_SECRET is only used when the merchant configured a
  // separate signing secret in the Partner dashboard. Fall back to API secret.
  const secret = env.SHOPIFY_WEBHOOK_SECRET ?? env.SHOPIFY_API_SECRET;
  const hmac = request.headers.get("X-Shopify-Hmac-Sha256");
  const topic = request.headers.get("X-Shopify-Topic") ?? "";
  const domain = request.headers.get("X-Shopify-Shop-Domain") ?? "";
  const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "unknown";
  // Per-IP + per-shop-domain cap. HMAC verification alone doesn't stop
  // a flood of correctly-signed replays, and unauthenticated attackers
  // would fail verification but still hit the JSON parser first.
  try {
    rateLimit({ key: `webhook:${domain}:${ip}`, max: 240, windowMs: 60_000 });
  } catch {
    return new Response("Too many requests", { status: 429 });
  }
  const raw = await request.text();

  if (!secret) {
    logger.warn("webhook.secret_missing", { topic, domain });
    return new Response("Webhook secret not configured", { status: 503 });
  }
  if (!verifyShopifyWebhook(raw, hmac, secret)) {
    logger.warn("webhook.hmac_invalid", { topic, domain });
    return new Response("Invalid HMAC", { status: 401 });
  }
  try {
    const payload = JSON.parse(raw) as T;
    return { topic, domain, payload };
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
}

export function ok(body: Record<string, unknown> = { ok: true }) {
  return new Response(JSON.stringify(body), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
}
