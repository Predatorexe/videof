import { lazy, Suspense, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Film, Play, Sparkles, TrendingUp } from "lucide-react";

import { PageShell, Stat } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartSkeleton } from "@/components/charts/chart-skeleton";
import {
  fmt,
  revenueTrend,
  topVideos,
  topWidgets,
  trafficSources,
  viewsTrend,
} from "@/lib/mock-data";

const ViewsAreaChart = lazy(() => import("@/components/charts/views-area-chart"));
const TrafficDonut = lazy(() => import("@/components/charts/traffic-donut"));
const RevenueBarChart = lazy(() => import("@/components/charts/revenue-bar-chart"));

export const Route = createFileRoute("/")({
  component: Dashboard,
  pendingComponent: DashboardPending,
});

const donutColors = ["var(--signal)", "var(--ember)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function DashboardPending() {
  return (
    <PageShell eyebrow="Overview" title="Loading dashboard…" description="Fetching the latest metrics.">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <ChartSkeleton key={i} className="h-24" />
        ))}
      </div>
      <ChartSkeleton className="h-64" />
    </PageShell>
  );
}

function Dashboard() {
  const rankedVideos = useMemo(() => topVideos.slice(0, 5), []);

  return (
    <PageShell
      eyebrow="Overview · This week"
      title="Good afternoon, Mira."
      description="Your storefront reels earned 48k views and $12,240 in attributed revenue this week."
      actions={
        <>
          <Button variant="outline" size="sm" asChild>
            <Link to="/analytics">
              Reports
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/videos">
              New upload
              <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat accent="signal" label="Total videos" value="128" hint="+12 this week" />
        <Stat label="Active widgets" value="7" hint="3 published site-wide" />
        <Stat label="Views" value={fmt.compact(48210)} hint="+18.4% vs last week" />
        <Stat accent="ember" label="Attributed revenue" value={fmt.money(12240)} hint="+22% vs last week" />
      </div>

      <section className="grid gap-3 lg:grid-cols-[2fr_1fr]">
        <div className="relative overflow-hidden rounded-xl border bg-card p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Views · Last 28 days
              </div>
              <div className="font-display mt-1 text-3xl">213,442</div>
            </div>
            <Badge variant="secondary" className="gap-1 text-xs">
              <TrendingUp className="h-3 w-3" /> +12.4%
            </Badge>
          </div>
          <div className="mt-4 h-64">
            <Suspense fallback={<ChartSkeleton className="h-64" />}>
              <ViewsAreaChart data={viewsTrend} />
            </Suspense>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Traffic sources
          </div>
          <div className="mt-2 grid grid-cols-[1fr_1fr] items-center gap-4">
            <div className="h-40">
              <Suspense fallback={<ChartSkeleton className="h-40" />}>
                <TrafficDonut data={trafficSources} colors={donutColors} />
              </Suspense>
            </div>
            <ul className="space-y-1.5 text-xs">
              {trafficSources.map((s, i) => (
                <li key={s.name} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: donutColors[i] }} />
                    {s.name}
                  </span>
                  <span className="font-mono text-muted-foreground">{s.value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Revenue by month
            </div>
            <Badge variant="outline" className="text-[10px]">USD</Badge>
          </div>
          <div className="h-56">
            <Suspense fallback={<ChartSkeleton className="h-56" />}>
              <RevenueBarChart data={revenueTrend} />
            </Suspense>
          </div>
        </div>

        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b p-5">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Top performing videos
              </div>
              <div className="font-display mt-1 text-2xl">This week</div>
            </div>
            <Button size="sm" variant="ghost" asChild>
              <Link to="/videos">All videos</Link>
            </Button>
          </div>
          <ul className="divide-y">
            {rankedVideos.map((v, i) => (
              <li key={v.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 p-4">
                <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                  <img loading="lazy" decoding="async" src={v.thumbnail} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 transition group-hover:opacity-100">
                    <Play className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{v.title}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="font-mono">#{i + 1}</span>
                    <span>·</span>
                    <span>{v.duration}</span>
                    <span>·</span>
                    <span>{fmt.compact(v.views)} views</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm">{fmt.pct((v.clicks / v.views) * 100)}</div>
                  <div className="text-[10px] text-muted-foreground">CTR</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <ActivityCard
          icon={<Film className="h-4 w-4" />}
          title="Recent uploads"
          items={[
            "Linen Overshirt — Field Test",
            "Runner 03 — First Miles",
            "Kettle Pour Study",
            "Studio Lamp — 60 seconds",
          ]}
          href="/videos"
        />
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Widget leaderboard
            </div>
            <Sparkles className="h-4 w-4 text-signal" />
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {topWidgets.map((w, i) => (
              <li key={w.id} className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                  <span className="truncate">{w.name}</span>
                </span>
                <span className="font-mono text-xs">{fmt.pct(w.ctr)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative overflow-hidden rounded-xl border bg-primary p-5 text-primary-foreground grain">
          <div className="text-[10px] uppercase tracking-[0.18em] opacity-70">Signal</div>
          <div className="font-display mt-2 text-2xl leading-tight">
            Your Story widget just outperformed the site average by 3.4×.
          </div>
          <Button size="sm" variant="secondary" className="mt-4">
            See widget
          </Button>
        </div>
      </section>
    </PageShell>
  );
}

function ActivityCard({
  icon,
  title,
  items,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  href: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{title}</div>
        <span className="grid h-6 w-6 place-items-center rounded-md bg-muted text-muted-foreground">
          {icon}
        </span>
      </div>
      <ul className="mt-3 space-y-2 text-sm">
        {items.map((it, i) => (
          <li key={i} className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0">
            <span className="truncate">{it}</span>
            <span className="font-mono text-[11px] text-muted-foreground">{i + 1}h</span>
          </li>
        ))}
      </ul>
      <Button asChild variant="ghost" size="sm" className="mt-3 h-8 w-full text-xs">
        <Link to={href}>View all</Link>
      </Button>
    </div>
  );
}
