/** Videos server functions. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { VideoPipelineService } from "@/lib/services/video/pipeline.server";
import { videoCreateSchema, videoUpdateSchema, listQuerySchema, uuid } from "@/lib/validation/schemas";
import { normalizePagination } from "@/lib/types";

export const listVideos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => listQuerySchema.extend({ shopId: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const { page, pageSize } = normalizePagination(data);
    const from = (page - 1) * pageSize;
    let q = context.supabase.from("videos")
      .select("*, video_products(product_id)", { count: "exact" })
      .eq("shop_id", data.shopId)
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);
    if (data.search) q = q.ilike("title", `%${data.search}%`);
    const { data: items, count, error } = await q;
    if (error) throw new Error(error.message);
    return { items: items ?? [], total: count ?? 0, page, pageSize };
  });

export const initiateVideoUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    videoCreateSchema.extend({
      filename: z.string().min(1).max(300),
      contentType: z.string().min(3).max(120),
      size: z.number().int().positive().max(5_000_000_000),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const svc = new VideoPipelineService(context.supabase);
    return svc.initiateUpload({
      shopId: data.shopId,
      title: data.title,
      description: data.description,
      filename: data.filename,
      contentType: data.contentType,
      size: data.size,
      uploadedBy: context.userId,
    });
  });

export const finalizeVideoUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const svc = new VideoPipelineService(context.supabase);
    await svc.markUploaded(data.id);
    return svc.syncFromProvider(data.id);
  });

export const updateVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => videoUpdateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { id, ...patch } = data;
    const row: Record<string, unknown> = {};
    if (patch.title) row.title = patch.title;
    if (patch.description !== undefined) row.description = patch.description;
    if (patch.tags) row.tags = patch.tags;
    const { data: updated, error } = await context.supabase.from("videos").update(row as never).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return updated;
  });

export const deleteVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const svc = new VideoPipelineService(context.supabase);
    return svc.remove(data.id);
  });

/** Assign products to a video with replace-set semantics. */
export const assignProductsToVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    videoId: uuid,
    productIds: z.array(uuid).max(200),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const del = await context.supabase.from("video_products").delete().eq("video_id", data.videoId);
    if (del.error) throw new Error(del.error.message);
    if (data.productIds.length === 0) return { ok: true as const };
    const rows = data.productIds.map((product_id, position) => ({
      video_id: data.videoId,
      product_id,
      position,
    }));
    const { error } = await context.supabase.from("video_products").insert(rows as never);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/** Increment click_count atomically via the analytics events table + direct update. */
export const trackVideoClick = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: cur } = await context.supabase.from("videos").select("click_count").eq("id", data.id).maybeSingle();
    const next = (cur?.click_count ?? 0) + 1;
    const { error } = await context.supabase.from("videos").update({ click_count: next } as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const, clicks: next };
  });

/** Append a tag to many videos. */
export const addTagToVideos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    ids: z.array(uuid).min(1).max(200),
    tag: z.string().trim().min(1).max(40),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error: readErr } = await context.supabase.from("videos")
      .select("id, tags").in("id", data.ids);
    if (readErr) throw new Error(readErr.message);
    for (const row of rows ?? []) {
      const current = (row.tags ?? []) as string[];
      if (current.includes(data.tag)) continue;
      const { error } = await context.supabase.from("videos")
        .update({ tags: [...current, data.tag] } as never).eq("id", row.id);
      if (error) throw new Error(error.message);
    }
    return { ok: true as const };
  });
