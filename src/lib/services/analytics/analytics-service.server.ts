/**
 * Analytics service — ingestion, aggregation, reporting.
 *
 * Ingestion: raw events written to analytics_events (append-only).
 * Aggregation: daily rollup into analytics_daily; scheduled by pg_cron.
 * Reporting: authenticated reads through repository.
 */
import type { DB } from "@/lib/db/repository.server";
import { ExternalServiceError } from "@/lib/errors";
import type { z } from "zod";
import type { analyticsEventSchema } from "@/lib/validation/schemas";

type EventInput = z.infer<typeof analyticsEventSchema>;

export class AnalyticsService {
  constructor(private readonly db: DB) {}

  async ingest(events: EventInput[]) {
    const rows = events.map((e) => ({
      shop_id: e.shopId,
      widget_id: e.widgetId ?? null,
      video_id: e.videoId ?? null,
      product_id: e.productId ?? null,
      event_type: e.eventType,
      session_id: e.sessionId ?? null,
      customer_id: e.customerId ?? null,
      amount: e.amount ?? null,
      currency: e.currency ?? null,
      metadata: e.metadata ?? {},
    }));
    const { error } = await this.db.from("analytics_events").insert(rows as never);
    if (error) throw new ExternalServiceError("analytics.ingest", error.message);
    return { inserted: rows.length };
  }

  /** Aggregated summary for a shop across a date range. */
  async summary(shopId: string, fromDay: string, toDay: string) {
    const { data, error } = await this.db.from("analytics_daily")
      .select("*").eq("shop_id", shopId).gte("day", fromDay).lte("day", toDay);
    if (error) throw new ExternalServiceError("analytics.summary", error.message);
    const rows = data ?? [];
    const totals = rows.reduce(
      (acc, r) => {
        acc.impressions += r.impressions ?? 0;
        acc.views += r.views ?? 0;
        acc.videoStarts += r.video_starts ?? 0;
        acc.videoCompletes += r.video_completes ?? 0;
        acc.ctaClicks += r.cta_clicks ?? 0;
        acc.addToCart += r.add_to_cart ?? 0;
        acc.orders += r.orders ?? 0;
        acc.revenue += Number(r.revenue ?? 0);
        return acc;
      },
      { impressions: 0, views: 0, videoStarts: 0, videoCompletes: 0, ctaClicks: 0, addToCart: 0, orders: 0, revenue: 0 },
    );
    const ctr = totals.impressions ? totals.ctaClicks / totals.impressions : 0;
    const completion = totals.videoStarts ? totals.videoCompletes / totals.videoStarts : 0;
    const conversion = totals.views ? totals.orders / totals.views : 0;
    return { ...totals, ctr, completion, conversion, days: rows };
  }
}
