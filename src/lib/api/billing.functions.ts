/** Billing server functions. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { BillingService, PLAN_LIMITS } from "@/lib/services/billing/billing-service.server";
import type { Plan } from "@/lib/services/billing/billing-service.server";
import { uuid } from "@/lib/validation/schemas";

export const getBillingOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ shopId: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const svc = new BillingService(context.supabase);
    const [subscription, invoices] = await Promise.all([
      svc.getSubscription(data.shopId),
      svc.listInvoices(data.shopId),
    ]);
    return { subscription, invoices, plans: PLAN_LIMITS };
  });

/**
 * Initiate a plan change. Returns a confirmationUrl the frontend redirects
 * to. When Shopify credentials are configured, the wrapped ShopifyBillingService
 * is invoked here and the shop is redirected to Shopify's approval screen.
 */
export const initiatePlanChange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ shopId: uuid, plan: z.enum(["starter", "growth", "scale", "enterprise"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    // Until real Shopify credentials exist, update local subscription state
    // and return a null confirmationUrl. Once the OAuth + billing wiring is
    // provisioned, replace this branch with ShopifyBillingService.createSubscription().
    const plan = data.plan as Plan;
    const { data: updated, error } = await context.supabase.from("subscriptions")
      .update({ plan, impression_limit: PLAN_LIMITS[plan].impressions } as never)
      .eq("shop_id", data.shopId).select().single();
    if (error) throw new Error(error.message);
    return { subscription: updated, confirmationUrl: null as string | null };
  });
