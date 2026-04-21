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

export type VelocityRow = {
  stage_id: number;
  stage_name: string;
  stage_color: string;
  avg_days: number;
  sample_size: number;
};

export function StageVelocityChart({ data }: { data: VelocityRow[] }) {
  if (data.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-12">
        Aún no hay suficiente historial para calcular velocidades.
      </div>
    );
  }
  const maxDays = Math.max(...data.map((d) => d.avg_days), 0.1);
  const bottleneckIdx = data.reduce(
    (best, d, i, arr) => (d.avg_days > arr[best].avg_days ? i : best),
    0,
  );
  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
        >
          <XAxis
            type="number"
            stroke="var(--muted-foreground)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            domain={[0, maxDays * 1.15]}
            tickFormatter={(v) => `${v.toFixed(1)}d`}
          />
          <YAxis
            type="category"
            dataKey="stage_name"
            stroke="var(--muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={140}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--popover)",
              color: "var(--popover-foreground)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 12,
            }}
            formatter={(v) => [
              `${Number(v).toFixed(1)} días`,
              "Tiempo promedio",
            ]}
          />
          <Bar dataKey="avg_days" radius={[0, 6, 6, 0]}>
            {data.map((d, i) => (
              <Cell
                key={d.stage_id}
                fill={i === bottleneckIdx ? "var(--destructive)" : d.stage_color}
                opacity={i === bottleneckIdx ? 1 : 0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
