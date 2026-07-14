/** Products server functions. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { productCreateSchema, listQuerySchema, uuid } from "@/lib/validation/schemas";
import { normalizePagination } from "@/lib/types";

export const listProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => listQuerySchema.extend({ shopId: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const { page, pageSize } = normalizePagination(data);
    const from = (page - 1) * pageSize;
    let q = context.supabase.from("products").select("*", { count: "exact" })
      .eq("shop_id", data.shopId)
      .order("updated_at", { ascending: false })
      .range(from, from + pageSize - 1);
    if (data.search) q = q.ilike("title", `%${data.search}%`);
    const { data: items, count, error } = await q;
    if (error) throw new Error(error.message);
    return { items: items ?? [], total: count ?? 0, page, pageSize };
  });

export const upsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => productCreateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const row = {
      shop_id: data.shopId,
      shopify_product_id: data.shopifyProductId,
      title: data.title,
      handle: data.handle,
      description: data.description,
      vendor: data.vendor,
      product_type: data.productType,
      status: data.status,
      price_min: data.priceMin,
      price_max: data.priceMax,
      currency: data.currency,
      image_url: data.imageUrl,
      tags: data.tags,
    };
    const { data: saved, error } = await context.supabase.from("products")
      .upsert(row as never, { onConflict: "shop_id,shopify_product_id" })
      .select().single();
    if (error) throw new Error(error.message);
    return saved;
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
