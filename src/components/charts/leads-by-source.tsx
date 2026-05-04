"use client";

import {
  PieChart,
  Pie,
  Cell,
  Sector,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const PALETTE = [
  "var(--primary)",
  "var(--warning)",
  "var(--success)",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
  "#f43f5e",
  "#6366f1",
];

type ActiveShapeProps = {
  cx?: number;
  cy?: number;
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  fill?: string;
};

function ActiveSector(props: ActiveShapeProps) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } =
    props;
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={(outerRadius ?? 0) + 6}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      style={{
        transition: "all 200ms ease-out",
        filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.18))",
      }}
    />
  );
}

export function LeadsBySourceChart({
  data,
}: {
  data: { source: string; count: number }[];
}) {
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="source"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            stroke="transparent"
            activeShape={ActiveSector}
            isAnimationActive
            animationDuration={400}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--popover)",
              color: "var(--popover-foreground)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 12,
              boxShadow: "0 8px 24px -8px rgb(0 0 0 / 0.25)",
            }}
            formatter={(value, name) => {
              const v = Number(value ?? 0);
              const pct = total > 0 ? ((v / total) * 100).toFixed(1) : "0";
              return [`${v} (${pct}%)`, name];
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
