/** Notifications server functions. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireShopifyOrSupabaseAuth as requireSupabaseAuth } from "@/lib/security/shopify-auth-middleware.server";
import { assertShopAccess, assertRecordShop } from "@/lib/security/authorize.server";
import { notificationCreateSchema, uuid } from "@/lib/validation/schemas";

export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ shopId: uuid, limit: z.number().int().min(1).max(200).default(50) }).parse(d))
  .handler(async ({ data, context }) => {
    const shopId = await assertShopAccess(context, data.shopId);
    const { data: rows, error } = await context.supabase.from("notifications")
      .select("*").eq("shop_id", shopId).order("created_at", { ascending: false }).limit(data.limit);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const shopId = await assertRecordShop(context, "notifications", data.id);
    const { error } = await context.supabase.from("notifications")
      .update({ read_at: new Date().toISOString() } as never)
      .eq("id", data.id).eq("shop_id", shopId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ shopId: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const shopId = await assertShopAccess(context, data.shopId);
    const { error } = await context.supabase.from("notifications")
      .update({ read_at: new Date().toISOString() } as never)
      .eq("shop_id", shopId).is("read_at", null);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const dismissNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const shopId = await assertRecordShop(context, "notifications", data.id);
    const { error } = await context.supabase.from("notifications")
      .delete().eq("id", data.id).eq("shop_id", shopId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const clearAllNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ shopId: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const shopId = await assertShopAccess(context, data.shopId);
    const { error } = await context.supabase.from("notifications")
      .delete().eq("shop_id", shopId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const createNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => notificationCreateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const shopId = await assertShopAccess(context, data.shopId);
    const { data: row, error } = await context.supabase.from("notifications").insert({
      shop_id: shopId,
      user_id: data.userId ?? null,
      kind: data.kind,
      title: data.title,
      body: data.body,
      link: data.link,
    } as never).select().single();
    if (error) throw new Error(error.message);
    return row;
  });
