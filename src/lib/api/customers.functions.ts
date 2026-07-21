/** Customers server functions. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireShopifyOrSupabaseAuth as requireSupabaseAuth } from "@/lib/security/shopify-auth-middleware.server";
import { assertShopAccess, assertRecordShop } from "@/lib/security/authorize.server";
import { listQuerySchema, uuid } from "@/lib/validation/schemas";
import { normalizePagination } from "@/lib/types";

export const listCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => listQuerySchema.extend({ shopId: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const shopId = await assertShopAccess(context, data.shopId);
    const { page, pageSize } = normalizePagination(data);
    const from = (page - 1) * pageSize;
    let q = context.supabase.from("customers").select("*", { count: "exact" })
      .eq("shop_id", shopId)
      .order("updated_at", { ascending: false })
      .range(from, from + pageSize - 1);
    if (data.search) q = q.or(`email.ilike.%${data.search}%,first_name.ilike.%${data.search}%,last_name.ilike.%${data.search}%`);
    const { data: items, count, error } = await q;
    if (error) throw new Error(error.message);
    return { items: items ?? [], total: count ?? 0, page, pageSize };
  });

export const getCustomer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const shopId = await assertRecordShop(context, "customers", data.id);
    const { data: row, error } = await context.supabase.from("customers")
      .select("*").eq("id", data.id).eq("shop_id", shopId).maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const shopId = await assertRecordShop(context, "customers", data.id);
    const { error } = await context.supabase.from("customers")
      .delete().eq("id", data.id).eq("shop_id", shopId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
