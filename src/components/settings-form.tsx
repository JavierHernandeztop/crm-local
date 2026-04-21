"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSettings } from "@/lib/actions/settings";
import type { Settings } from "@/lib/types";

export function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [hue, setHue] = useState<number>(Number(settings.brand_hue) || 221);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("brand_hue", String(hue));
    startTransition(async () => {
      try {
        await updateSettings(fd);
        toast.success("Ajustes guardados");
        router.refresh();
      } catch {
        toast.error("No se pudieron guardar los ajustes");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Nombre del negocio</Label>
          <Input
            name="business_name"
            defaultValue={settings.business_name}
            placeholder="Mi Negocio"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Moneda</Label>
          <Input
            name="currency"
            defaultValue={settings.currency}
            placeholder="USD, MXN, EUR…"
            maxLength={4}
            required
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Color de marca</Label>
          <span
            className="h-8 w-8 rounded-full border border-border shadow-inner"
            style={{ backgroundColor: `hsl(${hue} 75% 52%)` }}
          />
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={hue}
            onChange={(e) => setHue(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-foreground/10"
            style={{
              background: `linear-gradient(to right,
                hsl(0 75% 52%), hsl(60 75% 52%), hsl(120 75% 52%),
                hsl(180 75% 52%), hsl(240 75% 52%), hsl(300 75% 52%), hsl(360 75% 52%))`,
            }}
          />
          <span className="text-xs text-muted-foreground w-12 text-right tabular-nums">
            {hue}°
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Este color se aplica a botones, acentos y gráficos. Guarda para ver el
          cambio.
        </p>
      </div>

      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
