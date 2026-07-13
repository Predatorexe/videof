import { lazy, Suspense, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Film, Play, Sparkles, TrendingUp, Radio } from "lucide-react";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { ChartSkeleton } from "@/components/charts/chart-skeleton";
import { fmt, revenueTrend, trafficSources, viewsTrend } from "@/lib/mock-data";
import { useVideosStore } from "@/stores/videos-store";
import { useWidgetsStore } from "@/stores/widgets-store";
import { useActivityStore } from "@/stores/activity-store";
import { useProfileStore } from "@/stores/profile-store";
import { useUiStore } from "@/stores/ui-store";

const ViewsAreaChart = lazy(() => import("@/components/charts/views-area-chart"));
const RevenueBarChart = lazy(() => import("@/components/charts/revenue-bar-chart"));

export const Route = createFileRoute("/")({
  component: Dashboard,
  pendingComponent: DashboardPending,
});

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
  const videos = useVideosStore((s) => s.items);
  const widgets = useWidgetsStore((s) => s.items);
  const activity = useActivityStore((s) => s.entries);
  const profile = useProfileStore((s) => s.profile);
  const openUpload = useUiStore((s) => s.setUploadVideoOpen);

  const totals = useMemo(() => {
    const views = videos.reduce((s, v) => s + v.views, 0);
    const clicks = videos.reduce((s, v) => s + v.clicks, 0);
    const activeWidgets = widgets.filter((w) => w.enabled).length;
    const revenue = Math.round(clicks * 3.8);
    return { views, clicks, activeWidgets, revenue };
  }, [videos, widgets]);

  const rankedVideos = useMemo(
    () => [...videos].sort((a, b) => b.views - a.views).slice(0, 5),
    [videos],
  );
  const rankedWidgets = useMemo(
    () => [...widgets].sort((a, b) => b.ctr - a.ctr).slice(0, 5),
    [widgets],
  );

  const viewsTotal = useMemo(() => viewsTrend.reduce((s, x) => s + x.views, 0), []);

  return (
    <PageShell
      eyebrow="Control room · This week"
      title={`Good to see you, ${profile.firstName}.`}
      description={`${fmt.compact(totals.views)} views · ${fmt.money(totals.revenue)} attributed · ${totals.activeWidgets} widgets live across your storefront.`}
      actions={
        <>
          <Button variant="outline" size="sm" className="h-9 rounded-[3px] px-3 text-xs" asChild>
            <Link to="/analytics">
              Reports
              <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button size="sm" onClick={() => openUpload(true)} className="h-9 rounded-[3px] px-3 text-xs">
            New upload
            <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </>
      }
    >
      {/* Hero metric row — one editorial number + supporting stats */}
      <section className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <div className="term-card p-6 md:p-8">
          <div className="flex items-center justify-between">
            <div className="eyebrow-lg">Net gross revenue</div>
            <div className="flex items-center gap-2">
              <span className="live-dot" aria-hidden />
              <span className="eyebrow text-signal">Live</span>
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-3">
            <h2 className="hero-serif hero-enter break-words text-[clamp(2.5rem,12vw,3.75rem)] sm:text-6xl md:text-7xl lg:text-[92px]">
              {fmt.money(totals.revenue).replace("$", "$")}
            </h2>
            <span className="chip text-signal border-signal/30">
              <TrendingUp className="h-3 w-3" /> +22.4%
            </span>
          </div>
          <div className="mt-6 h-40">
            <Suspense fallback={<ChartSkeleton className="h-40" />}>
              <ViewsAreaChart data={viewsTrend} />
            </Suspense>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-white/30">
            <span>28 DAYS</span>
            <span>{fmt.n(viewsTotal)} VIEWS</span>
          </div>
        </div>

        <div className="grid gap-3">
          <MetricTile
            live
            label="Active widgets"
            value={fmt.n(totals.activeWidgets)}
            spark={[3, 5, 4, 6, 5, 7, 8]}
            hint={`${widgets.length} total`}
          />
          <MetricTile
            label="Views"
            value={fmt.compact(totals.views)}
            spark={[2, 3, 3, 4, 5, 6, 7]}
            hint={`${fmt.compact(totals.clicks)} clicks`}
          />
          <MetricTile
            label="Videos"
            value={fmt.n(videos.length)}
            spark={[4, 4, 5, 5, 6, 6, 7]}
            hint={`${videos.filter((v) => v.status === "published").length} published`}
          />
        </div>
      </section>

      {/* Engagement flow + Traffic composition */}
      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="term-card p-6">
          <div className="flex items-end justify-between">
            <div>
              <div className="eyebrow-lg">Engagement flow</div>
              <div className="mt-3 hero-serif text-3xl">Live traffic across surfaces</div>
            </div>
            <span className="chip font-mono tracking-widest">L-04 / NODE_A</span>
          </div>
          <div className="mt-4 h-56">
            <Suspense fallback={<ChartSkeleton className="h-56" />}>
              <RevenueBarChart data={revenueTrend} />
            </Suspense>
          </div>
        </div>

        <div className="term-card p-6">
          <div className="flex items-center justify-between">
            <div className="eyebrow-lg">Traffic composition</div>
            <Radio className="h-3.5 w-3.5 text-white/30" />
          </div>
          <ul className="mt-5 space-y-3">
            {trafficSources.map((s) => (
              <li key={s.name}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/70">{s.name}</span>
                  <span className="font-mono tabular-nums text-white/90">{s.value}%</span>
                </div>
                <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.04]">
                  <div
                    className="h-full rounded-full bg-signal"
                    style={{ width: `${s.value}%`, opacity: 0.35 + s.value / 100 }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Top videos + Widget leaderboard */}
      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="term-card">
          <div className="flex items-center justify-between border-b border-white/[0.05] px-6 py-4">
            <div>
              <div className="eyebrow-lg">Top performing videos</div>
              <div className="mt-2 hero-serif text-2xl">This week</div>
            </div>
            <Button size="sm" variant="ghost" className="h-8 rounded-[3px] text-[11px] uppercase tracking-wider" asChild>
              <Link to="/videos">All videos</Link>
            </Button>
          </div>
          <ul>
            {rankedVideos.length === 0 && (
              <li className="p-8 text-center text-sm text-white/40">
                No videos yet — upload one to get started.
              </li>
            )}
            {rankedVideos.map((v, i) => (
              <li
                key={v.id}
                className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-white/[0.04] px-6 py-3 last:border-b-0 hover:bg-white/[0.02]"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-white/30 tabular-nums w-6">
                    0{i + 1}
                  </span>
                  <div className="relative h-11 w-16 shrink-0 overflow-hidden rounded-[3px] bg-white/[0.04]">
                    <img
                      loading="lazy"
                      decoding="async"
                      src={v.thumbnail}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                      <Play className="h-3.5 w-3.5 text-white" fill="currentColor" />
                    </div>
                    <div className="absolute bottom-0.5 right-0.5 rounded-[2px] bg-black/70 px-1 py-0.5 font-mono text-[8px] text-white/80">
                      {v.duration}
                    </div>
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium text-white">{v.title}</div>
                  <div className="mt-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-white/40">
                    <span>{fmt.compact(v.views)} views</span>
                    <span>·</span>
                    <span>{fmt.compact(v.clicks)} clicks</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs tabular-nums text-signal">
                    {v.views > 0 ? fmt.pct((v.clicks / v.views) * 100) : "—"}
                  </div>
                  <div className="eyebrow mt-1">CTR</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="term-card p-6">
          <div className="flex items-center justify-between">
            <div className="eyebrow-lg">Widget leaderboard</div>
            <Sparkles className="h-3.5 w-3.5 text-signal" />
          </div>
          <ul className="mt-5 space-y-4">
            {rankedWidgets.length === 0 && (
              <li className="text-xs text-white/40">No widgets yet.</li>
            )}
            {rankedWidgets.map((w, i) => {
              const pct = Math.min(100, w.ctr * 8);
              return (
                <li key={w.id}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="font-mono text-[10px] tabular-nums text-white/30">
                        0{i + 1}
                      </span>
                      <span className="truncate text-white/80">{w.name}</span>
                    </span>
                    <span className="font-mono tabular-nums text-white/90">
                      {fmt.pct(w.ctr)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-[2px] w-full overflow-hidden rounded-full bg-white/[0.04]">
                    <div
                      className="h-full rounded-full bg-signal transition-[width] duration-500"
                      style={{ width: `${pct}%`, opacity: 0.4 + i * 0.1 }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Operation log */}
      <section className="term-card p-6">
        <div className="flex items-end justify-between border-b border-white/[0.08] pb-3">
          <div>
            <div className="eyebrow-lg">Operation log</div>
            <div className="mt-2 hero-serif text-2xl">Recent activity</div>
          </div>
          <Link
            to="/notifications"
            className="text-[10px] uppercase tracking-widest text-signal hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="mt-2">
          {activity.length === 0 && (
            <div className="py-6 text-center text-xs text-white/40">No activity yet.</div>
          )}
          {activity.slice(0, 8).map((e) => (
            <div key={e.id} className="op-row">
              <span className="font-mono text-[10px] uppercase tracking-wider text-white/30">
                {shortTime(e.at)}
              </span>
              <span className="min-w-0 truncate">
                <span className="font-medium text-white/90">{e.title}</span>
                {e.detail && <span className="text-white/40"> · {e.detail}</span>}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">
                {e.kind}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Signal callout */}
      <section className="term-card-live p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0 max-w-xl">
            <div className="eyebrow-lg text-signal">Signal detected</div>
            <div className="mt-3 hero-serif text-3xl md:text-4xl leading-[1.05]">
              Your Story widget just outperformed the site average by
              <span className="text-signal"> 3.4×</span>.
            </div>
            <p className="mt-3 text-xs text-white/50">
              Consider promoting it site-wide or duplicating the composition to your homepage carousel.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-9 rounded-[3px] px-3 text-xs" asChild>
              <Link to="/widgets">
                <Film className="mr-1.5 h-3.5 w-3.5" />
                Inspect
              </Link>
            </Button>
            <Button size="sm" className="h-9 rounded-[3px] px-3 text-xs" asChild>
              <Link to="/widgets">
                Promote
                <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

/* ------------------------------------------------------------------ */

function MetricTile({
  label,
  value,
  hint,
  spark,
  live,
}: {
  label: string;
  value: string;
  hint?: string;
  spark: number[];
  live?: boolean;
}) {
  const max = Math.max(...spark) || 1;
  return (
    <div className={`${live ? "term-card-live" : "term-card-muted"} card-hover flex items-center gap-4 p-5`}>
      <div className="flex-1 min-w-0">
        <div className="eyebrow">{label}</div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="hero-serif text-3xl">{value}</span>
        </div>
        {hint && <div className="mt-2 text-[10px] font-mono uppercase tracking-wider text-white/40">{hint}</div>}
      </div>
      <div className="flex h-10 items-end gap-[3px]">
        {spark.map((v, i) => (
          <span
            key={i}
            className={live ? "w-[3px] bg-signal" : "w-[3px] bg-white/25"}
            style={{ height: `${(v / max) * 100}%`, opacity: 0.35 + (i / spark.length) * 0.65 }}
          />
        ))}
      </div>
    </div>
  );
}

function shortTime(iso: string) {
  const d = new Date(iso);
  const hh = d.getUTCHours().toString().padStart(2, "0");
  const mm = d.getUTCMinutes().toString().padStart(2, "0");
  const ss = d.getUTCSeconds().toString().padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}
