import { memo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Datum = { day: string; views: number; clicks?: number };

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
};

function ViewsAreaChartImpl({ data, showClicks = false }: { data: Datum[]; showClicks?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--signal)" stopOpacity={0.6} />
            <stop offset="100%" stopColor="var(--signal)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
        <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="views" stroke="var(--signal)" strokeWidth={2} fill="url(#viewsFill)" />
        {showClicks ? (
          <Area type="monotone" dataKey="clicks" stroke="var(--ember)" strokeWidth={2} fill="transparent" />
        ) : null}
      </AreaChart>
    </ResponsiveContainer>
  );
}

const ViewsAreaChart = memo(ViewsAreaChartImpl);
export default ViewsAreaChart;
