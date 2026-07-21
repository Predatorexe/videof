/**
 * Authorization helpers for server functions.
 *
 * The unified auth middleware bypasses RLS by using the service-role Supabase
 * client. That means every handler MUST scope its queries to a shop the caller
 * is authorized to access — otherwise any authenticated user could pass an
 * arbitrary `shopId` / record `id` and read or mutate another merchant's data.
 *
 * Use `assertShopAccess` for shopId-scoped calls, and `assertRecordShop` for
 * id-scoped calls (fetches the row's `shop_id` and re-verifies access).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Ctx = {
  supabase: SupabaseClient<Database>;
  userId: string;
  shopId: string | undefined;
};

/** Ensure the caller can act on `shopId`. Returns the authorized shop id. */
export async function assertShopAccess(ctx: Ctx, shopId: string | undefined): Promise<string> {
  // Embedded (Shopify session token): shopId is already trusted from the JWT.
  if (ctx.shopId) {
    if (shopId && shopId !== ctx.shopId) {
      throw new Error("Forbidden: shop does not match authenticated Shopify session");
    }
    return ctx.shopId;
  }
  if (!shopId) throw new Error("Unauthorized: shop required");
  const { data, error } = await ctx.supabase.rpc("has_shop_access", {
    _user_id: ctx.userId,
    _shop_id: shopId,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
  return shopId;
}

/**
 * Look up a record's `shop_id` and verify the caller has access to it.
 * Prevents cross-tenant access when handlers accept a bare record `id`.
 */
export async function assertRecordShop(
  ctx: Ctx,
  table:
    | "products"
    | "videos"
    | "widgets"
    | "collections"
    | "customers"
    | "media_assets"
    | "notifications"
    | "shop_settings"
    | "subscriptions"
    | "invoices",
  id: string,
): Promise<string> {
  const { data, error } = await ctx.supabase
    .from(table)
    .select("shop_id")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Not found");
  return assertShopAccess(ctx, (data as { shop_id: string }).shop_id);
}
