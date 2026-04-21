"use client";

import { motion } from "motion/react";

export type FunnelStep = {
  stage_id: number;
  stage_name: string;
  stage_color: string;
  count: number;
  conversion_from_entry: number;
};

export function FunnelChart({ data }: { data: FunnelStep[] }) {
  if (data.length === 0) return null;
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-2.5">
      {data.map((step, i) => {
        const width = Math.max(
          (step.count / maxCount) * 100,
          step.count > 0 ? 12 : 4,
        );
        const dropFromPrev =
          i === 0 || !data[i - 1].count
            ? null
            : 1 - step.count / data[i - 1].count;
        return (
          <div key={step.stage_id} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: step.stage_color }}
                />
                <span className="font-medium truncate">{step.stage_name}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-muted-foreground">
                {dropFromPrev !== null && dropFromPrev > 0 && (
                  <span className="text-destructive">
                    −{(dropFromPrev * 100).toFixed(0)}%
                  </span>
                )}
                <span className="tabular-nums">
                  {step.count} lead{step.count === 1 ? "" : "s"}
                </span>
                <span className="tabular-nums font-semibold text-foreground">
                  {(step.conversion_from_entry * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="h-7 bg-muted/40 rounded-md overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${width}%` }}
                transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.08 }}
                className="h-full rounded-md flex items-center justify-end pr-3 text-[11px] font-semibold text-white"
                style={{ backgroundColor: step.stage_color }}
              >
                {step.count > 0 && width > 18 && (
                  <span>{(step.conversion_from_entry * 100).toFixed(0)}%</span>
                )}
              </motion.div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
