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
    let q = context.supabase.from("videos").select("*", { count: "exact" })
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
