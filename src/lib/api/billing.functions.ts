/** Billing server functions. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireShopifyOrSupabaseAuth as requireSupabaseAuth } from "@/lib/security/shopify-auth-middleware.server";
import { BillingService, PLAN_LIMITS } from "@/lib/services/billing/billing-service.server";
import type { Plan } from "@/lib/services/billing/billing-service.server";
import { uuid } from "@/lib/validation/schemas";
import { UnauthorizedError, NotFoundError, ExternalServiceError } from "@/lib/errors";
import { logger } from "@/lib/logger";

import { assertShopAccess } from "@/lib/security/authorize.server";

export const getBillingOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ shopId: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const shopId = await assertShopAccess(context, data.shopId);
    const svc = new BillingService(context.supabase);
    const [subscription, invoices] = await Promise.all([
      svc.getSubscription(shopId),
      svc.listInvoices(shopId),
    ]);
    return { subscription, invoices, plans: PLAN_LIMITS };
  });

/**
 * Initiate a plan change via the Shopify Billing API.
 *
 * Flow:
 *   1. Authorize the caller against the target shop (has_shop_access RPC).
 *   2. Load the shop's decrypted offline token via the admin Supabase client.
 *   3. Call `appSubscriptionCreate` for the requested plan.
 *   4. Persist { pending_plan, pending_charge_id, pending_confirmation_url }
 *      on the subscriptions row. The active plan is NOT changed here — that
 *      happens once Shopify confirms activation, either via the return
 *      callback (`/api/public/shopify/billing/callback`) or the
 *      APP_SUBSCRIPTIONS_UPDATE webhook.
 *   5. Return the confirmationUrl so the frontend can redirect the merchant.
 */
export const initiatePlanChange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      shopId: uuid,
      plan: z.enum(["starter", "growth", "scale", "enterprise"]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    // 1) Authorize the caller against the shop.
    const { data: allowed, error: accessErr } = await context.supabase
      .rpc("has_shop_access", { _user_id: context.userId, _shop_id: data.shopId });
    if (accessErr) throw new ExternalServiceError("billing.access_check", accessErr.message);
    if (!allowed) throw new UnauthorizedError("You do not have access to this shop");

    const plan = data.plan as Plan;
    const planConfig = PLAN_LIMITS[plan];

    // 2) Load the shop + admin client (needs service-role privileges to read
    //    the encrypted access token; do this AFTER authorization).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: shop, error: shopErr } = await supabaseAdmin
      .from("shops")
      .select("id, shopify_domain, name, currency, access_token_encrypted, uninstalled_at, plan_name")
      .eq("id", data.shopId)
      .maybeSingle();
    if (shopErr) throw new ExternalServiceError("billing.shop_lookup", shopErr.message);
    if (!shop) throw new NotFoundError("shop");
    if (shop.uninstalled_at) throw new UnauthorizedError("App was uninstalled from this shop");
    if (!shop.access_token_encrypted) {
      throw new UnauthorizedError("Shop has no Shopify access token — reinstall required");
    }

    const appUrl = process.env.SHOPIFY_APP_URL;
    if (!appUrl) throw new ExternalServiceError("billing.config", "SHOPIFY_APP_URL not configured");

    const { decryptToken } = await import("@/lib/security/token-crypto.server");
    const { ShopifyAdminClient } = await import("@/lib/services/shopify/admin-client.server");
    const { ShopifyBillingService, chargeIdFromGid } = await import(
      "@/lib/services/shopify/billing-service.server"
    );

    const admin = new ShopifyAdminClient({
      shopifyDomain: shop.shopify_domain,
      accessToken: decryptToken(shop.access_token_encrypted),
    });
    const billing = new ShopifyBillingService(admin);

    // Test charges: forced ON in development mode, or when the merchant is
    // on a Shopify development store (Partner-owned stores can't be billed).
    const envTest = (process.env.SHOPIFY_BILLING_TEST ?? "").toLowerCase() === "true";
    const isDevStore = /developer preview|affiliate|partner|staff/i.test(shop.plan_name ?? "");
    const test = envTest || isDevStore;

    const returnUrl = `${appUrl.replace(/\/$/, "")}/api/public/shopify/billing/callback?shop=${encodeURIComponent(shop.shopify_domain)}`;

    // 3) Create the AppSubscription.
    let result;
    try {
      result = await billing.createSubscription({
        name: planConfig.displayName,
        monthlyPrice: planConfig.priceUSD,
        currencyCode: shop.currency ?? "USD",
        returnUrl,
        test,
      });
    } catch (err) {
      logger.error("billing.initiate_plan_change.shopify_failed", {
        shopId: shop.id,
        plan,
        message: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }

    const chargeId = chargeIdFromGid(result.appSubscription.id);

    // 4) Persist pending state. Upsert so we create the row on first plan
    //    change if the trial hasn't already ensured one.
    const svc = new BillingService(supabaseAdmin);
    await svc.ensureSubscription(shop.id, "starter");
    const { data: updated, error: updErr } = await supabaseAdmin
      .from("subscriptions")
      .update({
        pending_plan: plan,
        pending_charge_id: chargeId,
        pending_confirmation_url: result.confirmationUrl,
        currency_code: shop.currency ?? "USD",
        test_charge: test,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("shop_id", shop.id)
      .select()
      .single();
    if (updErr) throw new ExternalServiceError("billing.persist_pending", updErr.message);

    logger.info("billing.initiate_plan_change.pending", {
      shopId: shop.id,
      plan,
      chargeId,
      test,
    });

    return { subscription: updated, confirmationUrl: result.confirmationUrl };
  });
