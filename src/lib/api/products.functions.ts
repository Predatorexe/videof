/** Products server functions. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireShopifyOrSupabaseAuth as requireSupabaseAuth } from "@/lib/security/shopify-auth-middleware.server";
import { assertShopAccess, assertRecordShop } from "@/lib/security/authorize.server";
import { productCreateSchema, listQuerySchema, uuid } from "@/lib/validation/schemas";
import { normalizePagination } from "@/lib/types";

export const listProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => listQuerySchema.extend({ shopId: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const shopId = await assertShopAccess(context, data.shopId);
    const { page, pageSize } = normalizePagination(data);
    const from = (page - 1) * pageSize;
    let q = context.supabase.from("products")
      .select("*, video_products(video_id)", { count: "exact" })
      .eq("shop_id", shopId)
      .order("updated_at", { ascending: false })
      .range(from, from + pageSize - 1);
    if (data.search) q = q.ilike("title", `%${data.search}%`);
    const { data: items, count, error } = await q;
    if (error) throw new Error(error.message);
    return { items: items ?? [], total: count ?? 0, page, pageSize };
  });

export const upsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => productCreateSchema.extend({ inventory: z.number().int().min(0).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const shopId = await assertShopAccess(context, data.shopId);
    const row = {
      shop_id: shopId,
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
      inventory: data.inventory,
    };
    const { data: saved, error } = await context.supabase.from("products")
      .upsert(row as never, { onConflict: "shop_id,shopify_product_id" })
      .select().single();
    if (error) throw new Error(error.message);
    return saved;
  });

export const updateProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: uuid,
    title: z.string().max(200).optional(),
    status: z.enum(["active", "draft", "archived"]).optional(),
    inventory: z.number().int().min(0).optional(),
    priceMin: z.number().nonnegative().optional(),
    vendor: z.string().max(120).optional(),
    imageUrl: z.string().url().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const shopId = await assertRecordShop(context, "products", data.id);
    const { id, ...patch } = data;
    const row: Record<string, unknown> = {};
    if (patch.title !== undefined) row.title = patch.title;
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.inventory !== undefined) row.inventory = patch.inventory;
    if (patch.priceMin !== undefined) row.price_min = patch.priceMin;
    if (patch.vendor !== undefined) row.vendor = patch.vendor;
    if (patch.imageUrl !== undefined) row.image_url = patch.imageUrl;
    const { data: updated, error } = await context.supabase.from("products")
      .update(row as never).eq("id", id).eq("shop_id", shopId).select().single();
    if (error) throw new Error(error.message);
    return updated;
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const shopId = await assertRecordShop(context, "products", data.id);
    const { error } = await context.supabase.from("products")
      .delete().eq("id", data.id).eq("shop_id", shopId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const assignVideosToProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    productId: uuid,
    videoIds: z.array(uuid).max(200),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const shopId = await assertRecordShop(context, "products", data.productId);
    // Verify every video belongs to the same shop.
    if (data.videoIds.length > 0) {
      const { data: vids, error: vErr } = await context.supabase.from("videos")
        .select("id").eq("shop_id", shopId).in("id", data.videoIds);
      if (vErr) throw new Error(vErr.message);
      if ((vids?.length ?? 0) !== data.videoIds.length) {
        throw new Error("Forbidden: one or more videos are not in this shop");
      }
    }
    // Replace-set semantics.
    const del = await context.supabase.from("video_products").delete().eq("product_id", data.productId);
    if (del.error) throw new Error(del.error.message);
    if (data.videoIds.length === 0) return { ok: true as const };
    const rows = data.videoIds.map((video_id, position) => ({
      product_id: data.productId,
      video_id,
      position,
    }));
    const { error } = await context.supabase.from("video_products").insert(rows as never);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const bulkAssignVideos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    productIds: z.array(uuid).min(1).max(200),
    videoIds: z.array(uuid).min(1).max(200),
  }).parse(d))
  .handler(async ({ data, context }) => {
    // Every product AND video must belong to the caller's shop.
    const shopId = await assertShopAccess(context, undefined).catch(() => null);
    // If we couldn't resolve caller shop, derive it from the first product then re-verify.
    const anchorShop = shopId ?? await assertRecordShop(context, "products", data.productIds[0]);
    const { data: prods, error: pErr } = await context.supabase.from("products")
      .select("id").eq("shop_id", anchorShop).in("id", data.productIds);
    if (pErr) throw new Error(pErr.message);
    if ((prods?.length ?? 0) !== data.productIds.length) {
      throw new Error("Forbidden: one or more products are not in this shop");
    }
    const { data: vids, error: vErr } = await context.supabase.from("videos")
      .select("id").eq("shop_id", anchorShop).in("id", data.videoIds);
    if (vErr) throw new Error(vErr.message);
    if ((vids?.length ?? 0) !== data.videoIds.length) {
      throw new Error("Forbidden: one or more videos are not in this shop");
    }
    // Additive semantics: leaves existing links intact, upserts new pairs.
    const rows: { product_id: string; video_id: string }[] = [];
    for (const p of data.productIds) for (const v of data.videoIds) rows.push({ product_id: p, video_id: v });
    const { error } = await context.supabase.from("video_products")
      .upsert(rows as never, { onConflict: "video_id,product_id", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
