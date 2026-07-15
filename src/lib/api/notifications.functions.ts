/** Notifications server functions. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { notificationCreateSchema, uuid } from "@/lib/validation/schemas";

export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ shopId: uuid, limit: z.number().int().min(1).max(200).default(50) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.from("notifications")
      .select("*").eq("shop_id", data.shopId).order("created_at", { ascending: false }).limit(data.limit);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("notifications")
      .update({ read_at: new Date().toISOString() } as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ shopId: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("notifications")
      .update({ read_at: new Date().toISOString() } as never)
      .eq("shop_id", data.shopId).is("read_at", null);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const dismissNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("notifications").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const clearAllNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ shopId: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("notifications").delete().eq("shop_id", data.shopId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const createNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => notificationCreateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: hasAccess } = await context.supabase.rpc("has_shop_access", {
      _user_id: context.userId, _shop_id: data.shopId,
    });
    if (!hasAccess) throw new Error("Forbidden");
    const { data: row, error } = await context.supabase.from("notifications").insert({
      shop_id: data.shopId,
      user_id: data.userId ?? null,
      kind: data.kind,
      title: data.title,
      body: data.body,
      link: data.link,
    } as never).select().single();
    if (error) throw new Error(error.message);
    return row;
  });
