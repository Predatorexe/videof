/**
 * Shopify Billing return callback.
 *
 * Shopify redirects the merchant here after they approve (or decline) an
 * AppSubscription. The URL carries `?shop=<domain>&charge_id=<numeric>`.
 *
 * We:
 *   1. Validate `shop` is a real *.myshopify.com host.
 *   2. Load the shop row + admin client.
 *   3. Confirm the pending charge belongs to this shop.
 *   4. Fetch the AppSubscription node from Shopify to read authoritative
 *      status/name/currentPeriodEnd (never trust query params for money).
 *   5. Reconcile the `subscriptions` row (promote pending → active, or clear
 *      pending on decline).
 *   6. Redirect the merchant back into the embedded admin billing view.
 */
import { createFileRoute } from "@tanstack/react-router";
import { isValidShopDomain, normalizeShopDomain } from "@/lib/services/shopify/shop-domain.server";
import { logger } from "@/lib/logger";
import { PLAN_LIMITS, type Plan } from "@/lib/services/billing/billing-service.server";

function bad(status: number, message: string) {
  return new Response(message, { status });
}

export const Route = createFileRoute("/api/public/shopify/billing/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const shopRaw = url.searchParams.get("shop") ?? "";
        const chargeId = (url.searchParams.get("charge_id") ?? "").trim();
        const shop = normalizeShopDomain(shopRaw);
        if (!isValidShopDomain(shop)) return bad(400, "Invalid shop");
        if (!chargeId) return bad(400, "Missing charge_id");

        const apiKey = process.env.SHOPIFY_API_KEY;
        if (!apiKey) return bad(503, "Shopify app not configured");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: shopRow, error: shopErr } = await supabaseAdmin
          .from("shops")
          .select("id, shopify_domain, access_token_encrypted, uninstalled_at")
          .eq("shopify_domain", shop)
          .maybeSingle();
        if (shopErr) {
          logger.error("billing.callback.shop_lookup_failed", { message: shopErr.message });
          return bad(500, "Server error");
        }
        if (!shopRow || !shopRow.access_token_encrypted || shopRow.uninstalled_at) {
          return bad(404, "Shop not found");
        }

        const { data: sub, error: subErr } = await supabaseAdmin
          .from("subscriptions")
          .select("id, plan, status, pending_plan, pending_charge_id, currency_code, test_charge")
          .eq("shop_id", shopRow.id)
          .maybeSingle();
        if (subErr) {
          logger.error("billing.callback.sub_lookup_failed", { message: subErr.message });
          return bad(500, "Server error");
        }
        if (!sub || sub.pending_charge_id !== chargeId) {
          logger.warn("billing.callback.charge_mismatch", {
            shop, expected: sub?.pending_charge_id, got: chargeId,
          });
          return bad(409, "Charge does not match a pending subscription");
        }

        // Fetch authoritative state from Shopify.
        const { decryptToken } = await import("@/lib/security/token-crypto.server");
        const { ShopifyAdminClient } = await import("@/lib/services/shopify/admin-client.server");
        const { ShopifyBillingService } = await import(
          "@/lib/services/shopify/billing-service.server"
        );
        const admin = new ShopifyAdminClient({
          shopifyDomain: shopRow.shopify_domain,
          accessToken: decryptToken(shopRow.access_token_encrypted),
        });
        const billing = new ShopifyBillingService(admin);

        let node;
        try {
          node = await billing.getSubscription(`gid://shopify/AppSubscription/${chargeId}`);
        } catch (err) {
          logger.error("billing.callback.node_fetch_failed", {
            shop, chargeId, message: err instanceof Error ? err.message : String(err),
          });
          return bad(502, "Could not verify subscription with Shopify");
        }
        if (!node) return bad(404, "Subscription not found on Shopify");

        const pendingPlan = sub.pending_plan as Plan | null;
        const nowIso = new Date().toISOString();
        const status = node.status;

        if (status === "ACTIVE") {
          const nextPlan: Plan = pendingPlan ?? (sub.plan as Plan);
          const limit = PLAN_LIMITS[nextPlan].impressions;
          await supabaseAdmin.from("subscriptions").update({
            plan: nextPlan,
            status: "active",
            shopify_charge_id: chargeId,
            impression_limit: limit,
            current_period_start: nowIso,
            current_period_end: node.currentPeriodEnd,
            pending_plan: null,
            pending_charge_id: null,
            pending_confirmation_url: null,
            updated_at: nowIso,
          } as never).eq("id", sub.id);
          logger.info("billing.callback.activated", { shop, chargeId, plan: nextPlan });
        } else if (status === "PENDING" || status === "ACCEPTED") {
          // Merchant closed the tab before Shopify finalized; leave the
          // pending state in place and rely on the webhook to reconcile.
          logger.info("billing.callback.still_pending", { shop, chargeId, status });
        } else {
          // DECLINED / EXPIRED / CANCELLED / FROZEN → clear pending state,
          // keep the current active plan untouched.
          await supabaseAdmin.from("subscriptions").update({
            pending_plan: null,
            pending_charge_id: null,
            pending_confirmation_url: null,
            updated_at: nowIso,
          } as never).eq("id", sub.id);
          logger.info("billing.callback.rejected", { shop, chargeId, status });
        }

        // Send the merchant back into the embedded admin billing page.
        const storeHandle = shop.slice(0, -".myshopify.com".length);
        const target = `https://admin.shopify.com/store/${encodeURIComponent(storeHandle)}/apps/${apiKey}/billing`;
        return Response.redirect(target, 302);
      },
    },
  },
});
