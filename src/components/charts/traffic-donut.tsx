import { memo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

type Datum = { name: string; value: number };

function TrafficDonutImpl({ data, colors }: { data: Datum[]; colors: string[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          innerRadius={38}
          outerRadius={64}
          paddingAngle={3}
          stroke="var(--card)"
          isAnimationActive={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

const TrafficDonut = memo(TrafficDonutImpl);
export default TrafficDonut;
