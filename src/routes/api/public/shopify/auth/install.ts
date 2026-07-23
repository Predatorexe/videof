/**
 * GET /api/public/shopify/auth/install?shop=<shop>.myshopify.com
 *
 * Entry point for OAuth. Validates the shop domain, mints a signed state
 * nonce (persisted for callback verification), and redirects the merchant
 * to Shopify's OAuth consent screen.
 *
 * Callable unauthenticated because Shopify's Admin "Install app" button
 * links directly here. Rate-limited per shop+IP to block enumeration.
 */
import { createFileRoute } from "@tanstack/react-router";
import { randomBytes } from "node:crypto";
import { isValidShopDomain, normalizeShopDomain } from "@/lib/services/shopify/shop-domain.server";
import { rateLimit } from "@/lib/security/rate-limit.server";
import { logger } from "@/lib/logger";

export const Route = createFileRoute("/api/public/shopify/auth/install")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const shopRaw = url.searchParams.get("shop");
        const shop = shopRaw ? normalizeShopDomain(shopRaw) : "";
        if (!isValidShopDomain(shop)) {
          return new Response("Invalid shop parameter", { status: 400 });
        }

        const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "unknown";
        try {
          await rateLimit({ key: `shopify:install:${shop}:${ip}`, max: 30, windowMs: 60_000 });
        } catch {
          return new Response("Too many install attempts", { status: 429 });
        }

        const apiKey = process.env.SHOPIFY_API_KEY;
        const scopes = process.env.SHOPIFY_SCOPES;
        const appUrl = process.env.SHOPIFY_APP_URL;
        if (!apiKey || !scopes || !appUrl) {
          logger.error("shopify.install.missing_config", {
            hasKey: !!apiKey, hasScopes: !!scopes, hasAppUrl: !!appUrl,
          });
          return new Response("Shopify app not configured", { status: 503 });
        }

        const state = randomBytes(32).toString("hex");
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("shop_oauth_states").insert({
          state,
          shop_domain: shop,
        });
        if (error) {
          logger.error("shopify.install.state_persist_failed", { message: error.message });
          return new Response("Could not start install", { status: 500 });
        }

        const redirectUri = `${appUrl.replace(/\/$/, "")}/api/public/shopify/auth/callback`;
        const authorize = new URL(`https://${shop}/admin/oauth/authorize`);
        authorize.searchParams.set("client_id", apiKey);
        authorize.searchParams.set("scope", scopes);
        authorize.searchParams.set("redirect_uri", redirectUri);
        authorize.searchParams.set("state", state);
        return Response.redirect(authorize.toString(), 302);
      },
    },
  },
});
