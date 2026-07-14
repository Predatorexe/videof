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
import { serverEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

export interface VerifiedWebhook<T = unknown> {
  topic: string;
  domain: string;
  payload: T;
}

export async function verifyAndParse<T = unknown>(request: Request): Promise<VerifiedWebhook<T> | Response> {
  const env = serverEnv();
  const secret = env.SHOPIFY_WEBHOOK_SECRET;
  const hmac = request.headers.get("X-Shopify-Hmac-Sha256");
  const topic = request.headers.get("X-Shopify-Topic") ?? "";
  const domain = request.headers.get("X-Shopify-Shop-Domain") ?? "";
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
