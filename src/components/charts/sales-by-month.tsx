"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export function SalesByMonthChart({
  data,
  currency,
}: {
  data: { month: string; total: number }[];
  currency: string;
}) {
  const formatted = data.map((d) => {
    const [year, month] = d.month.split("-");
    const monthName = new Date(Number(year), Number(month) - 1).toLocaleDateString(
      "es-ES",
      { month: "short" },
    );
    return { ...d, label: `${monthName} ${year.slice(2)}` };
  });

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={formatted} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            stroke="var(--muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => {
              if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
              return String(v);
            }}
          />
          <Tooltip
            cursor={{ fill: "color-mix(in oklch, var(--primary) 8%, transparent)" }}
            contentStyle={{
              backgroundColor: "var(--popover)",
              color: "var(--popover-foreground)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 12,
            }}
            formatter={(v) =>
              new Intl.NumberFormat("es-ES", {
                style: "currency",
                currency,
              }).format(Number(v) || 0)
            }
          />
          <Bar dataKey="total" fill="var(--primary)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
