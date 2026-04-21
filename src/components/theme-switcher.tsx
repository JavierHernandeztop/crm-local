"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const current = mounted ? theme ?? "system" : "system";

  const options = [
    { v: "light", label: "Claro", Icon: Sun },
    { v: "dark", label: "Oscuro", Icon: Moon },
    { v: "system", label: "Sistema", Icon: Monitor },
  ];

  return (
    <div className="inline-flex rounded-md border border-border bg-background p-1">
      {options.map((o) => {
        const active = current === o.v;
        return (
          <button
            key={o.v}
            type="button"
            onClick={() => setTheme(o.v)}
            className={cn(
              "inline-flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <o.Icon className="h-4 w-4" /> {o.label}
          </button>
        );
      })}
    </div>
  );
}
