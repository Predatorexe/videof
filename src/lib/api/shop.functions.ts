/**
 * Shop context server functions.
 * Resolves the caller's currently-active Shopify shop from the shop_users
 * membership (falls back to first shop the user has any role on).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getCurrentShop = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("shop_id, shops(id, name, shopify_domain)")
      .eq("user_id", context.userId)
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data?.shops) return null;
    const s = data.shops as { id: string; name: string; shopify_domain: string };
    return { id: s.id, name: s.name, domain: s.shopify_domain };
  });
