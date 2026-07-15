import { lazy, Suspense, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

import { PageShell, Stat } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartSkeleton } from "@/components/charts/chart-skeleton";
import { fmt } from "@/lib/format";
import { useVideosStore } from "@/stores/videos-store";
import { useWidgetsStore } from "@/stores/widgets-store";
import { useActivityStore } from "@/stores/activity-store";
import { useAnalyticsStore, type ViewsPoint } from "@/stores/analytics-store";
import { exportCsv } from "@/lib/csv";

const ViewsAreaChart = lazy(() => import("@/components/charts/views-area-chart"));
const RevenueBarChart = lazy(() => import("@/components/charts/revenue-bar-chart"));
const WatchTimeLineChart = lazy(() => import("@/components/charts/watchtime-line-chart"));

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
  pendingComponent: AnalyticsPending,
});

function AnalyticsPending() {
  return (
    <PageShell eyebrow="Reports" title="Loading analytics…" description="Crunching your numbers.">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <ChartSkeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <ChartSkeleton className="h-56" />
        <ChartSkeleton className="h-56" />
      </div>
    </PageShell>
  );
}

type Range = "daily" | "weekly" | "monthly" | "yearly";

function aggregate(range: Range, viewsTrend: ViewsPoint[]): ViewsPoint[] {
  // Derive a series from the daily source, aggregated to the chosen bucket.
  if (range === "daily") return viewsTrend;
  const bucket = range === "weekly" ? 7 : range === "monthly" ? 4 : 12;
  const out: ViewsPoint[] = [];
  for (let i = 0; i < viewsTrend.length; i += bucket) {
    const slice = viewsTrend.slice(i, i + bucket);
    if (slice.length === 0) continue;
    out.push({
      day: range === "yearly" ? `M${out.length + 1}` : `${range[0].toUpperCase()}${out.length + 1}`,
      views: slice.reduce((s, x) => s + x.views, 0),
      clicks: slice.reduce((s, x) => s + x.clicks, 0),
    });
  }
  return out;
}

function AnalyticsPage() {
  const videos = useVideosStore((s) => s.items);
  const widgets = useWidgetsStore((s) => s.items);
  const log = useActivityStore((s) => s.log);
  const viewsTrend = useAnalyticsStore((s) => s.viewsSeries);
  const revenueTrend = useAnalyticsStore((s) => s.revenueSeries);
  const [range, setRange] = useState<Range>("daily");

  const series = useMemo(() => aggregate(range, viewsTrend), [range, viewsTrend]);

  const totals = useMemo(() => {
    const views = videos.reduce((s, v) => s + v.views, 0);
    const clicks = videos.reduce((s, v) => s + v.clicks, 0);
    const impressions = widgets.reduce((s, w) => s + w.impressions, 0);
    const ctr = views > 0 ? (clicks / views) * 100 : 0;
    const completion = 55 + (ctr % 8); // deterministic proxy
    const avgSec = 30 + Math.round((clicks % 40));
    return { views, clicks, impressions, ctr, completion, avgSec };
  }, [videos, widgets]);

  const rankedVideos = useMemo(
    () => [...videos].sort((a, b) => b.views - a.views).slice(0, 8),
    [videos],
  );
  const rankedWidgets = useMemo(
    () => [...widgets].sort((a, b) => b.ctr - a.ctr).slice(0, 10),
    [widgets],
  );

  const exportSeriesCsv = () => {
    exportCsv(`analytics-${range}`, series);
    log("export", `Analytics exported (${range})`);
    toast.success("CSV downloaded");
  };

  const exportSummaryXls = () => {
    // Simple TSV — opens cleanly in Excel/Numbers.
    const rows = [
      ["Metric", "Value"],
      ["Views", totals.views],
      ["Clicks", totals.clicks],
      ["Impressions", totals.impressions],
      ["CTR (%)", totals.ctr.toFixed(2)],
      ["Avg watch time (sec)", totals.avgSec],
      ["Completion (%)", totals.completion.toFixed(1)],
      ["Range", range],
    ];
    const tsv = rows.map((r) => r.join("\t")).join("\n");
    const blob = new Blob([tsv], { type: "application/vnd.ms-excel;charset=utf-8" });
    if (typeof document !== "undefined") {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-summary-${range}.xls`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 500);
    }
    log("export", "Analytics summary exported (Excel)");
    toast.success("Excel downloaded");
  };

  return (
    <PageShell
      eyebrow="Reports"
      title="Analytics"
      description="Views, clicks, watch time, and conversion — sliced by video, widget, and source."
      actions={
        <>
          <Button variant="outline" size="sm" onClick={exportSummaryXls}>
            <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportSeriesCsv}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> CSV
          </Button>
        </>
      }
    >
      <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat accent="signal" label="Views" value={fmt.compact(totals.views)} hint={`${videos.length} videos`} />
        <Stat label="Impressions" value={fmt.compact(totals.impressions)} hint={`${widgets.length} widgets`} />
        <Stat label="Avg. watch" value={`${String(Math.floor(totals.avgSec / 60)).padStart(2, "0")}:${String(totals.avgSec % 60).padStart(2, "0")}`} hint="+3s vs prior" />
        <Stat accent="ember" label="CTR" value={fmt.pct(totals.ctr)} hint={`${fmt.pct(totals.completion)} completion`} />
      </div>

      <section className="grid gap-3 lg:grid-cols-2">
        <ChartCard title={`Views vs clicks · ${range}`}>
          <Suspense fallback={<ChartSkeleton className="h-56" />}>
            <ViewsAreaChart data={series} showClicks />
          </Suspense>
        </ChartCard>

        <ChartCard title="Revenue">
          <Suspense fallback={<ChartSkeleton className="h-56" />}>
            <RevenueBarChart data={revenueTrend} showRefunds={false} />
          </Suspense>
        </ChartCard>

        <ChartCard title="Watch time (min)">
          <Suspense fallback={<ChartSkeleton className="h-56" />}>
            <WatchTimeLineChart data={series} />
          </Suspense>
        </ChartCard>

        <div className="rounded-xl border bg-card">
          <div className="border-b p-4">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Top videos</div>
          </div>
          <ul className="divide-y">
            {rankedVideos.map((v, i) => (
              <li key={v.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 p-3">
                <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                <span className="truncate text-sm">{v.title}</span>
                <span className="font-mono text-xs">{fmt.compact(v.views)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="rounded-xl border bg-card">
        <div className="border-b p-4">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Top widgets</div>
        </div>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Widget</th>
              <th className="px-4 py-2">Placement</th>
              <th className="px-4 py-2">Impressions</th>
              <th className="px-4 py-2">CTR</th>
              <th className="px-4 py-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rankedWidgets.map((w) => (
              <tr key={w.id} className="border-t">
                <td className="px-4 py-2 font-medium">{w.name}</td>
                <td className="px-4 py-2 text-muted-foreground">{w.placement}</td>
                <td className="px-4 py-2 font-mono">{fmt.n(w.impressions)}</td>
                <td className="px-4 py-2 font-mono">{fmt.pct(w.ctr)}</td>
                <td className="px-4 py-2 text-muted-foreground">{fmt.date(w.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{title}</div>
      <div className="h-56">{children}</div>
    </div>
  );
}
