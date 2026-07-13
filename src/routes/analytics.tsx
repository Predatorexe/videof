import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, FileSpreadsheet } from "lucide-react";

import { PageShell, Stat } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fmt, revenueTrend, topVideos, topWidgets, viewsTrend } from "@/lib/mock-data";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
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
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={viewsTrend} margin={{ left: -20, right: 8 }}>
              <defs>
                <linearGradient id="viewsG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--signal)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--signal)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="views" stroke="var(--signal)" strokeWidth={2} fill="url(#viewsG)" />
              <Area type="monotone" dataKey="clicks" stroke="var(--ember)" strokeWidth={2} fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueTrend} margin={{ left: -20, right: 8 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="revenue" fill="var(--signal)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Watch time (min)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={viewsTrend} margin={{ left: -20, right: 8 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="views" stroke="var(--chart-3)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="rounded-xl border bg-card">
          <div className="border-b p-4">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Top videos</div>
          </div>
          <ul className="divide-y">
            {topVideos.map((v, i) => (
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
            {topWidgets.map((w) => (
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

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
};

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{title}</div>
      <div className="h-56">{children}</div>
    </div>
  );
}
