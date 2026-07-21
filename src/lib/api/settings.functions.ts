/** Settings server functions. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireShopifyOrSupabaseAuth as requireSupabaseAuth } from "@/lib/security/shopify-auth-middleware.server";
import { assertShopAccess } from "@/lib/security/authorize.server";
import { settingsUpdateSchema, uuid } from "@/lib/validation/schemas";

export const getSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ shopId: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const shopId = await assertShopAccess(context, data.shopId);
    const { data: row, error } = await context.supabase.from("shop_settings")
      .select("*").eq("shop_id", shopId).maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => settingsUpdateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const shopId = await assertShopAccess(context, data.shopId);
    const patch = {
      shop_id: shopId,
      brand_color: data.brandColor,
      accent_color: data.accentColor,
      default_language: data.defaultLanguage,
      analytics_enabled: data.analyticsEnabled,
      storefront_domain: data.storefrontDomain,
      data: data.data ?? {},
    };
    const { data: row, error } = await context.supabase.from("shop_settings")
      .upsert(patch as never, { onConflict: "shop_id" }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });
