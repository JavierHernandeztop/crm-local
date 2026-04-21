"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Row = { stage_name: string; stage_color: string; lost_count: number };

export function LossByStageChart({ data }: { data: Row[] }) {
  if (data.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-10">
        Aún no has perdido leads. 🎉
      </div>
    );
  }
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
        >
          <XAxis
            type="number"
            stroke="var(--muted-foreground)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="stage_name"
            stroke="var(--muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={120}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--popover)",
              color: "var(--popover-foreground)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 12,
            }}
            formatter={(v) => [`${v} perdidos`, "Leads"]}
          />
          <Bar dataKey="lost_count" radius={[0, 6, 6, 0]}>
            {data.map((r, i) => (
              <Cell key={i} fill={r.stage_color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
