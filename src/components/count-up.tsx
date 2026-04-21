"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  /** Render as currency using Intl.NumberFormat. Takes precedence over prefix/suffix/decimals. */
  currency?: string;
};

export function CountUp({
  value,
  duration = 900,
  decimals = 0,
  prefix = "",
  suffix = "",
  currency,
}: Props) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    startRef.current = performance.now();

    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - (startRef.current ?? now)) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  let rendered: string;
  if (currency) {
    try {
      rendered = new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }).format(display);
    } catch {
      rendered = `${currency} ${display.toFixed(2)}`;
    }
  } else {
    rendered = `${prefix}${display.toFixed(decimals)}${suffix}`;
  }

  return <span className="tabular-nums">{rendered}</span>;
}
