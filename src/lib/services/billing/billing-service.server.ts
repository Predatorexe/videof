/**
 * Local billing service — mirrors Shopify Billing plan state into the
 * `subscriptions` table so the app can enforce impression caps + surface
 * usage in the UI. The actual charge/upgrade round-trips still go through
 * Shopify Billing API via ShopifyBillingService.
 */
import type { DB } from "@/lib/db/repository.server";
import { ExternalServiceError, NotFoundError } from "@/lib/errors";

export type Plan = "starter" | "growth" | "scale" | "enterprise";

export const PLAN_LIMITS: Record<Plan, { impressions: number; priceUSD: number; displayName: string }> = {
  starter:    { impressions: 5_000,     priceUSD: 15,  displayName: "Videofy Starter" },
  growth:     { impressions: 20_000,    priceUSD: 25,  displayName: "Videofy Growth" },
  scale:      { impressions: 60_000,    priceUSD: 60,  displayName: "Videofy Scale" },
  enterprise: { impressions: 5_000_000, priceUSD: 499, displayName: "Videofy Enterprise" },
};

export class BillingService {
  constructor(private readonly db: DB) {}

  async getSubscription(shopId: string) {
    const { data, error } = await this.db.from("subscriptions").select("*").eq("shop_id", shopId).maybeSingle();
    if (error) throw new ExternalServiceError("billing.get", error.message);
    return data;
  }

  async ensureSubscription(shopId: string, plan: Plan = "starter") {
    const existing = await this.getSubscription(shopId);
    if (existing) return existing;
    const { data, error } = await this.db.from("subscriptions").insert({
      shop_id: shopId,
      plan,
      status: "trialing",
      impression_limit: PLAN_LIMITS[plan].impressions,
    }).select().single();
    if (error) throw new ExternalServiceError("billing.create", error.message);
    return data;
  }

  async recordImpressionUsage(shopId: string, count: number) {
    const sub = await this.getSubscription(shopId);
    if (!sub) throw new NotFoundError("subscription");
    const nextUsed = (sub.impression_used ?? 0) + count;
    const overage = Math.max(0, nextUsed - (sub.impression_limit ?? 0));
    const { data, error } = await this.db.from("subscriptions").update({
      impression_used: nextUsed,
      overage_impressions: overage,
    }).eq("shop_id", shopId).select().single();
    if (error) throw new ExternalServiceError("billing.record_usage", error.message);
    return data;
  }

  async listInvoices(shopId: string) {
    const { data, error } = await this.db.from("invoices")
      .select("*").eq("shop_id", shopId).order("created_at", { ascending: false });
    if (error) throw new ExternalServiceError("billing.invoices", error.message);
    return data;
  }
}
