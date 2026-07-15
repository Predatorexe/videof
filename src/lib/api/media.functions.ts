/** Media server functions. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireShopifyOrSupabaseAuth as requireSupabaseAuth } from "@/lib/security/shopify-auth-middleware.server";
import { uuid } from "@/lib/validation/schemas";

export const listMedia = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    shopId: uuid,
    kind: z.enum(["video", "image", "thumbnail", "poster"]).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("media_assets").select("*")
      .eq("shop_id", data.shopId).order("created_at", { ascending: false });
    if (data.kind) q = q.eq("kind", data.kind);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const deleteMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("media_assets").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
