/** Collections server functions. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { collectionCreateSchema, uuid } from "@/lib/validation/schemas";

export const listCollections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ shopId: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.from("collections")
      .select("*").eq("shop_id", data.shopId).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => collectionCreateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("collections").insert({
      shop_id: data.shopId,
      title: data.title,
      handle: data.handle,
      description: data.description,
      image_url: data.imageUrl,
    } as never).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const assignProductsToCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    collectionId: uuid,
    productIds: z.array(uuid).min(1).max(500),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const rows = data.productIds.map((product_id, position) => ({
      collection_id: data.collectionId, product_id, position,
    }));
    const { error } = await context.supabase.from("collection_products")
      .upsert(rows as never, { onConflict: "collection_id,product_id" });
    if (error) throw new Error(error.message);
    return { ok: true as const, count: rows.length };
  });

export const deleteCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("collections").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
