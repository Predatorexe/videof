/** Widgets server functions. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireShopifyOrSupabaseAuth as requireSupabaseAuth } from "@/lib/security/shopify-auth-middleware.server";
import { assertShopAccess, assertRecordShop } from "@/lib/security/authorize.server";
import { WidgetService } from "@/lib/services/widget/widget-service.server";
import { widgetCreateSchema, widgetUpdateSchema, widgetPublishSchema, uuid } from "@/lib/validation/schemas";

export const listWidgets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ shopId: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const shopId = await assertShopAccess(context, data.shopId);
    const { data: rows, error } = await context.supabase.from("widgets")
      .select("*").eq("shop_id", shopId).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getWidget = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const shopId = await assertRecordShop(context, "widgets", data.id);
    const { data: row, error } = await context.supabase.from("widgets")
      .select("*, widget_videos(video_id, position)")
      .eq("id", data.id).eq("shop_id", shopId).maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const createWidget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => widgetCreateSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertShopAccess(context, data.shopId);
    return new WidgetService(context.supabase).create(data, context.userId);
  });

export const updateWidget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => widgetUpdateSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertRecordShop(context, "widgets", data.id);
    return new WidgetService(context.supabase).update(data);
  });

/** Toggle widget enabled/disabled by flipping status between published/draft. */
export const toggleWidget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: uuid, enabled: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const shopId = await assertRecordShop(context, "widgets", data.id);
    const { data: row, error } = await context.supabase.from("widgets")
      .update({ status: data.enabled ? "published" : "draft" } as never)
      .eq("id", data.id).eq("shop_id", shopId).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

/** Rename a widget in place. */
export const renameWidget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: uuid, name: z.string().trim().min(1).max(120) }).parse(d))
  .handler(async ({ data, context }) => {
    const shopId = await assertRecordShop(context, "widgets", data.id);
    const { data: row, error } = await context.supabase.from("widgets")
      .update({ name: data.name } as never)
      .eq("id", data.id).eq("shop_id", shopId).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

/** Publish and persist publish_meta atomically. */
export const publishWidget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => widgetPublishSchema.parse(d))
  .handler(async ({ data, context }) => {
    const shopId = await assertRecordShop(context, "widgets", data.id);
    const svc = new WidgetService(context.supabase);
    const published = await svc.publish(data.id, context.userId);
    const token = ((published.widget.publish_meta as { embedToken?: string } | null)?.embedToken)
      || `wgt_${data.id.replace(/-/g, "")}_${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const meta = {
      embedToken: token,
      publicUrl: `https://cdn.videofy.app/w/${data.id}?t=${token}`,
      previewUrl: `/widget-preview/${data.id}`,
      createdAt: (published.widget.publish_meta as { createdAt?: string } | null)?.createdAt ?? now,
      updatedAt: now,
      version: published.version.version,
      status: "live" as const,
    };
    const { error } = await context.supabase.from("widgets")
      .update({ publish_meta: meta as never })
      .eq("id", data.id).eq("shop_id", shopId);
    if (error) throw new Error(error.message);
    return { widget: { ...published.widget, publish_meta: meta }, version: published.version, meta };
  });

export const unpublishWidget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => widgetPublishSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertRecordShop(context, "widgets", data.id);
    return new WidgetService(context.supabase).unpublish(data.id);
  });

export const listWidgetVersions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRecordShop(context, "widgets", data.id);
    return new WidgetService(context.supabase).versions(data.id);
  });

export const deleteWidget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRecordShop(context, "widgets", data.id);
    return new WidgetService(context.supabase).remove(data.id);
  });

export const duplicateWidget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const shopId = await assertRecordShop(context, "widgets", data.id);
    const { data: src, error: readErr } = await context.supabase.from("widgets")
      .select("*").eq("id", data.id).eq("shop_id", shopId).maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!src) throw new Error("Widget not found");
    const suffix = Date.now().toString(36);
    const { data: copy, error } = await context.supabase.from("widgets").insert({
      shop_id: src.shop_id,
      type: src.type,
      name: `${src.name} (copy)`,
      handle: `${src.handle ?? "widget"}-copy-${suffix}`,
      config: src.config,
      custom_css: src.custom_css,
      status: "draft",
      created_by: context.userId,
    } as never).select().single();
    if (error) throw new Error(error.message);
    return copy;
  });
