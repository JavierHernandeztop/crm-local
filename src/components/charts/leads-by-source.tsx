"use client";

import {
  PieChart,
  Pie,
  Cell,
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

export function LeadsBySourceChart({
  data,
}: {
  data: { source: string; count: number }[];
}) {
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
