import { lazy, Suspense, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FileSpreadsheet } from "lucide-react";

import { PageShell, Stat } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartSkeleton } from "@/components/charts/chart-skeleton";
import { fmt, revenueTrend, topVideos, topWidgets, viewsTrend } from "@/lib/mock-data";

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

function AnalyticsPage() {
  const rankedVideos = useMemo(() => topVideos.slice(0, 8), []);
  const rankedWidgets = useMemo(() => topWidgets.slice(0, 10), []);

  return (
    <PageShell
      eyebrow="Reports"
      title="Analytics"
      description="Views, clicks, watch time, and conversion — sliced by video, widget, and source."
      actions={
        <>
          <Button variant="outline" size="sm">
            <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> Excel
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-3.5 w-3.5" /> CSV
          </Button>
        </>
      }
    >
      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat accent="signal" label="Views" value={fmt.compact(213442)} hint="+12.4% WoW" />
        <Stat label="Unique visitors" value={fmt.compact(84120)} hint="+8.1% WoW" />
        <Stat label="Avg. watch time" value="00:42" hint="+3s" />
        <Stat accent="ember" label="Completion" value="61.8%" hint="+4.2pt" />
      </div>

      <section className="grid gap-3 lg:grid-cols-2">
        <ChartCard title="Views vs clicks">
          <Suspense fallback={<ChartSkeleton className="h-56" />}>
            <ViewsAreaChart data={viewsTrend} showClicks />
          </Suspense>
        </ChartCard>

        <ChartCard title="Revenue">
          <Suspense fallback={<ChartSkeleton className="h-56" />}>
            <RevenueBarChart data={revenueTrend} showRefunds={false} />
          </Suspense>
        </ChartCard>

        <ChartCard title="Watch time (min)">
          <Suspense fallback={<ChartSkeleton className="h-56" />}>
            <WatchTimeLineChart data={viewsTrend} />
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
