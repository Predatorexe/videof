/** Analytics server functions — reporting only (ingestion is via /api/public/analytics/track). */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireShopifyOrSupabaseAuth as requireSupabaseAuth } from "@/lib/security/shopify-auth-middleware.server";
import { assertShopAccess } from "@/lib/security/authorize.server";
import { AnalyticsService } from "@/lib/services/analytics/analytics-service.server";
import { uuid } from "@/lib/validation/schemas";

export const getAnalyticsSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      shopId: uuid,
      fromDay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      toDay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const shopId = await assertShopAccess(context, data.shopId);
    return new AnalyticsService(context.supabase).summary(shopId, data.fromDay, data.toDay);
  });

export const listRecentEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ shopId: uuid, limit: z.number().int().min(1).max(500).default(100) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const shopId = await assertShopAccess(context, data.shopId);
    const { data: rows, error } = await context.supabase.from("analytics_events")
      .select("*").eq("shop_id", shopId)
      .order("occurred_at", { ascending: false }).limit(data.limit);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
