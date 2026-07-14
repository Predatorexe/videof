/** Widgets server functions. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { WidgetService } from "@/lib/services/widget/widget-service.server";
import { widgetCreateSchema, widgetUpdateSchema, widgetPublishSchema, uuid } from "@/lib/validation/schemas";

export const listWidgets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ shopId: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.from("widgets")
      .select("*").eq("shop_id", data.shopId).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getWidget = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("widgets")
      .select("*, widget_videos(video_id, position)").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const createWidget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => widgetCreateSchema.parse(d))
  .handler(async ({ data, context }) =>
    new WidgetService(context.supabase).create(data, context.userId),
  );

export const updateWidget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => widgetUpdateSchema.parse(d))
  .handler(async ({ data, context }) =>
    new WidgetService(context.supabase).update(data),
  );

export const publishWidget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => widgetPublishSchema.parse(d))
  .handler(async ({ data, context }) =>
    new WidgetService(context.supabase).publish(data.id, context.userId),
  );

export const unpublishWidget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => widgetPublishSchema.parse(d))
  .handler(async ({ data, context }) =>
    new WidgetService(context.supabase).unpublish(data.id),
  );

export const listWidgetVersions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) =>
    new WidgetService(context.supabase).versions(data.id),
  );

export const deleteWidget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) =>
    new WidgetService(context.supabase).remove(data.id),
  );
