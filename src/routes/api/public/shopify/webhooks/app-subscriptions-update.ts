/**
 * APP_SUBSCRIPTIONS_UPDATE webhook handler.
 *
 * Shopify sends this whenever an AppSubscription changes state: ACTIVE,
 * DECLINED, CANCELLED, EXPIRED, FROZEN. It is the authoritative
 * reconciliation channel for merchant plan state — even if the merchant
 * closes the browser tab before hitting our return callback, this fires.
 *
 * Payload (Shopify Admin REST Webhook, JSON):
 * {
 *   "app_subscription": {
 *     "admin_graphql_api_id": "gid://shopify/AppSubscription/12345",
 *     "name": "Videofy Growth",
 *     "status": "ACTIVE",
 *     "admin_graphql_api_shop_id": "gid://shopify/Shop/1",
 *     "created_at": "...",
 *     "updated_at": "...",
 *     "currency": "USD",
 *     "capped_amount": null
 *   }
 * }
 */
import { createFileRoute } from "@tanstack/react-router";
import { verifyAndParse, ok } from "@/lib/services/shopify/webhook-utils.server";
import { chargeIdFromGid } from "@/lib/services/shopify/billing-service.server";
import { PLAN_LIMITS, type Plan } from "@/lib/services/billing/billing-service.server";
import { logger } from "@/lib/logger";

interface AppSubscriptionPayload {
  app_subscription?: {
    admin_graphql_api_id?: string | null;
    name?: string | null;
    status?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    currency?: string | null;
    current_period_end?: string | null;
  };
}

const STATUS_MAP: Record<string, "active" | "cancelled" | "past_due" | "frozen"> = {
  ACTIVE: "active",
  DECLINED: "cancelled",
  EXPIRED: "cancelled",
  CANCELLED: "cancelled",
  FROZEN: "frozen",
  PENDING: "past_due",
  ACCEPTED: "past_due",
};

export const Route = createFileRoute(
  "/api/public/shopify/webhooks/app-subscriptions-update",
)({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const verified = await verifyAndParse<AppSubscriptionPayload>(request);
        if (verified instanceof Response) return verified;

        const sub = verified.payload.app_subscription;
        if (!sub) {
          logger.warn("billing.webhook.missing_subscription", { domain: verified.domain });
          return ok({ ignored: true });
        }
        const chargeId = chargeIdFromGid(sub.admin_graphql_api_id ?? null);
        const rawStatus = (sub.status ?? "").toUpperCase();
        const mappedStatus = STATUS_MAP[rawStatus];
        if (!chargeId || !mappedStatus) {
          logger.warn("billing.webhook.bad_payload", {
            domain: verified.domain, chargeId, rawStatus,
          });
          return ok({ ignored: true });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: shop, error: shopErr } = await supabaseAdmin
          .from("shops")
          .select("id")
          .eq("shopify_domain", verified.domain)
          .maybeSingle();
        if (shopErr || !shop) {
          logger.warn("billing.webhook.unknown_shop", { domain: verified.domain });
          return ok({ ignored: true });
        }

        const { data: existing } = await supabaseAdmin
          .from("subscriptions")
          .select("id, plan, pending_plan, shopify_charge_id, pending_charge_id")
          .eq("shop_id", shop.id)
          .maybeSingle();
        if (!existing) {
          logger.warn("billing.webhook.no_subscription_row", { domain: verified.domain });
          return ok({ ignored: true });
        }

        const nowIso = new Date().toISOString();
        const matchesPending = existing.pending_charge_id === chargeId;
        const matchesActive = existing.shopify_charge_id === chargeId;

        if (mappedStatus === "active") {
          // Prefer pending_plan when this charge was the one the merchant
          // just approved; otherwise leave the current plan intact.
          const nextPlan: Plan = matchesPending
            ? ((existing.pending_plan as Plan | null) ?? (existing.plan as Plan))
            : (existing.plan as Plan);
          const limit = PLAN_LIMITS[nextPlan].impressions;
          await supabaseAdmin.from("subscriptions").update({
            plan: nextPlan,
            status: "active",
            shopify_charge_id: chargeId,
            impression_limit: limit,
            current_period_start: nowIso,
            current_period_end: sub.current_period_end ?? null,
            pending_plan: null,
            pending_charge_id: null,
            pending_confirmation_url: null,
            currency_code: sub.currency ?? null,
            updated_at: nowIso,
          } as never).eq("id", existing.id);
          logger.info("billing.webhook.activated", {
            domain: verified.domain, chargeId, plan: nextPlan,
          });
        } else if (mappedStatus === "cancelled") {
          if (matchesActive) {
            // The active subscription itself was cancelled — drop the shop
            // back to the free/starter baseline.
            await supabaseAdmin.from("subscriptions").update({
              status: "cancelled",
              shopify_charge_id: null,
              pending_plan: null,
              pending_charge_id: null,
              pending_confirmation_url: null,
              updated_at: nowIso,
            } as never).eq("id", existing.id);
          } else if (matchesPending) {
            // The pending charge was declined/expired — clear pending, keep
            // the current active plan.
            await supabaseAdmin.from("subscriptions").update({
              pending_plan: null,
              pending_charge_id: null,
              pending_confirmation_url: null,
              updated_at: nowIso,
            } as never).eq("id", existing.id);
          }
          logger.info("billing.webhook.cancelled", {
            domain: verified.domain, chargeId, matchesActive, matchesPending,
          });
        } else if (mappedStatus === "frozen") {
          await supabaseAdmin.from("subscriptions").update({
            status: "frozen",
            updated_at: nowIso,
          } as never).eq("id", existing.id);
          logger.info("billing.webhook.frozen", { domain: verified.domain, chargeId });
        }
        // PENDING/ACCEPTED are transient and don't require an update.

        return ok();
      },
    },
  },
});
