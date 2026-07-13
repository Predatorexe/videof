import { memo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Datum = { month: string; revenue: number; refunds?: number };

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
};

function RevenueBarChartImpl({ data, showRefunds = true }: { data: Datum[]; showRefunds?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ left: -20, right: 8 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
        <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="revenue" fill="var(--signal)" radius={[3, 3, 0, 0]} />
        {showRefunds ? <Bar dataKey="refunds" fill="var(--ember)" radius={[3, 3, 0, 0]} /> : null}
      </BarChart>
    </ResponsiveContainer>
  );
}

const RevenueBarChart = memo(RevenueBarChartImpl);
export default RevenueBarChart;
