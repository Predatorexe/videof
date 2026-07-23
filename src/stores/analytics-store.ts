/**
 * Analytics store.
 *
 * Exposes the chart-ready series consumed by the Dashboard and Analytics
 * routes. Hydrates from `getAnalyticsSummary` when a Shopify shop is
 * connected; falls back to the deterministic mock seeds when running in
 * Lovable preview mode (no shop context). Follows the same
 * hydrate-on-shop-change + reset pattern as the other domain stores.
 */
import { create } from "zustand";
import { toast } from "sonner";
// Analytics is fully backed by database aggregates via getAnalyticsSummary.
// No demo/seed fallback — the dashboard renders empty until real events exist.
import { getAnalyticsSummary } from "@/lib/api/analytics.functions";
import { subscribeShopHydration } from "@/lib/adapters/shop-hydration";

export type ViewsPoint = { day: string; views: number; clicks: number };
export type RevenuePoint = { month: string; revenue: number; refunds: number };
export type TrafficSource = { name: string; value: number };

type State = {
  viewsSeries: ViewsPoint[];
  revenueSeries: RevenuePoint[];
  trafficSources: TrafficSource[];
  _shopId: string | null;
  _hydrated: boolean;
  hydrate: (shopId: string) => Promise<void>;
  reset: () => void;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Format an ISO date (YYYY-MM-DD) as a short "MM-DD" bucket label. */
function shortDayLabel(day: string): string {
  // "2026-07-15" -> "07-15"; falls back to the raw value on unexpected input.
  const parts = day.split("-");
  return parts.length === 3 ? `${parts[1]}-${parts[2]}` : day;
}

type SummaryDay = {
  day: string;
  views: number | null;
  cta_clicks: number | null;
  revenue: number | null;
};

/** Collapse per-widget/video daily rows into a single point per calendar day. */
function toViewsSeries(rows: SummaryDay[]): ViewsPoint[] {
  const byDay = new Map<string, { views: number; clicks: number }>();
  for (const r of rows) {
    const cur = byDay.get(r.day) ?? { views: 0, clicks: 0 };
    cur.views += r.views ?? 0;
    cur.clicks += r.cta_clicks ?? 0;
    byDay.set(r.day, cur);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([day, v]) => ({ day: shortDayLabel(day), views: v.views, clicks: v.clicks }));
}

/** Aggregate daily rows by calendar month for the revenue bar chart. */
function toRevenueSeries(rows: SummaryDay[]): RevenuePoint[] {
  const byMonth = new Map<number, number>();
  for (const r of rows) {
    const parts = r.day.split("-");
    if (parts.length !== 3) continue;
    const monthIndex = Number(parts[1]) - 1;
    if (Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) continue;
    byMonth.set(monthIndex, (byMonth.get(monthIndex) ?? 0) + Number(r.revenue ?? 0));
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a - b)
    .map(([m, revenue]) => ({ month: MONTHS[m], revenue: Math.round(revenue), refunds: 0 }));
}

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

export const useAnalyticsStore = create<State>((set, get) => ({
  viewsSeries: [],
  revenueSeries: [],
  trafficSources: [],
  _shopId: null,
  _hydrated: false,

  hydrate: async (shopId: string) => {
    try {
      const summary = await getAnalyticsSummary({
        data: { shopId, fromDay: isoDaysAgo(364), toDay: isoDaysAgo(0) },
      });
      const days = (summary.days ?? []) as SummaryDay[];
      set({
        viewsSeries: toViewsSeries(days).slice(-28),
        revenueSeries: toRevenueSeries(days),
        trafficSources: [],
        _shopId: shopId,
        _hydrated: true,
      });
    } catch (err) {
      if (!get()._hydrated) set({ _shopId: shopId, _hydrated: true });
      const msg = err instanceof Error ? err.message : "Failed to load analytics";
      toast.error(msg);
    }
  },

  reset: () =>
    set({
      viewsSeries: [],
      revenueSeries: [],
      trafficSources: [],
      _shopId: null,
      _hydrated: false,
    }),
}));

subscribeShopHydration({
  hydrate: (shopId) => useAnalyticsStore.getState().hydrate(shopId),
  reset: () => useAnalyticsStore.getState().reset(),
});
