"use client";

import { useRef, useState, useTransition } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  GripVertical,
  Image as ImageIcon,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  completeOnboarding,
  skipOnboarding,
} from "@/lib/actions/onboarding";
import { uploadLogo } from "@/lib/actions/logo";

type StageDraft = {
  name: string;
  color: string;
  kind: "open" | "won" | "lost";
};

const DEFAULT_STAGES: StageDraft[] = [
  { name: "Nuevo lead", color: "#3b82f6", kind: "open" },
  { name: "En conversación", color: "#f59e0b", kind: "open" },
  { name: "Propuesta enviada", color: "#8b5cf6", kind: "open" },
  { name: "Cerrado ganado", color: "#10b981", kind: "won" },
  { name: "Perdido", color: "#ef4444", kind: "lost" },
];

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#64748b",
];

const CURRENCIES = ["USD", "MXN", "EUR", "COP", "ARS", "CLP", "PEN", "BRL"];

export function OnboardingWizard({ initialHue }: { initialHue: number }) {
  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [hue, setHue] = useState(initialHue);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [stages, setStages] = useState<StageDraft[]>(DEFAULT_STAGES);
  const [isPending, startTransition] = useTransition();

  const totalSteps = 5;

  const canNext = [
    () => businessName.trim().length > 0,
    () => currency.trim().length > 0,
    () => true,
    () => true, // logo is optional
    () => stages.length > 0 && stages.every((s) => s.name.trim()),
  ][step]();

  const next = () => canNext && setStep((s) => Math.min(totalSteps - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const finish = () => {
    startTransition(async () => {
      try {
        if (logoFile) {
          const fd = new FormData();
          fd.set("logo", logoFile);
          try {
            await uploadLogo(fd);
          } catch (err) {
            toast.error(
              err instanceof Error
                ? `Logo: ${err.message}`
                : "No se pudo subir el logo",
            );
          }
        }
        await completeOnboarding({
          business_name: businessName,
          currency,
          brand_hue: hue,
          stages,
        });
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "No se pudo guardar",
        );
      }
    });
  };

  const skip = () => {
    startTransition(async () => {
      await skipOnboarding();
    });
  };

  return (
    <div
      className="w-full max-w-2xl"
      style={{ "--brand-hue": String(hue) } as React.CSSProperties}
    >
      <div className="rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
        {/* Progress */}
        <div className="h-1 bg-muted">
          <motion.div
            className="h-full bg-primary"
            initial={false}
            animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
          />
        </div>

        <div className="p-8 sm:p-10">
          <div className="flex items-center justify-between mb-6">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Paso {step + 1} de {totalSteps}
            </div>
            <button
              type="button"
              onClick={skip}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              disabled={isPending}
            >
              Saltar
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && (
                <StepPanel
                  title="¡Bienvenido a tu CRM!"
                  description="Vamos a configurarlo en menos de un minuto. Empecemos con el nombre de tu negocio."
                >
                  <Label>Nombre del negocio</Label>
                  <Input
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Ej: Estudio Aurora"
                    autoFocus
                    className="h-11 text-base"
                  />
                </StepPanel>
              )}

              {step === 1 && (
                <StepPanel
                  title="¿En qué moneda facturas?"
                  description="La usaremos al mostrar montos de pagos y totales."
                >
                  <Label>Moneda</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {CURRENCIES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCurrency(c)}
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm transition-colors",
                          currency === c
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:bg-accent",
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Label>O escribe otra</Label>
                    <Input
                      value={currency}
                      onChange={(e) =>
                        setCurrency(e.target.value.toUpperCase().slice(0, 5))
                      }
                      maxLength={5}
                      className="max-w-24"
                    />
                  </div>
                </StepPanel>
              )}

              {step === 2 && (
                <StepPanel
                  title="Tu color de marca"
                  description="Elige un color que se use en toda la interfaz. Los botones, acentos y gráficos usarán este tono."
                >
                  <div className="flex items-center gap-4 mt-2">
                    <div
                      className="h-16 w-16 rounded-2xl shadow-inner shrink-0 transition-colors"
                      style={{
                        backgroundColor: `hsl(${hue} 75% 52%)`,
                      }}
                    />
                    <div className="flex-1 space-y-2">
                      <input
                        type="range"
                        min={0}
                        max={360}
                        value={hue}
                        onChange={(e) => setHue(Number(e.target.value))}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
                        style={{
                          background: `linear-gradient(to right,
                            hsl(0 75% 52%), hsl(60 75% 52%), hsl(120 75% 52%),
                            hsl(180 75% 52%), hsl(240 75% 52%), hsl(300 75% 52%), hsl(360 75% 52%))`,
                        }}
                      />
                      <div className="text-xs text-muted-foreground text-right tabular-nums">
                        {hue}°
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 p-4 rounded-lg bg-accent">
                    <p className="text-sm mb-3">Así se verán tus botones:</p>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground shadow-sm">
                        Botón primario
                      </button>
                      <button className="px-4 py-2 rounded-md text-sm font-medium border border-border bg-background hover:bg-accent">
                        Secundario
                      </button>
                    </div>
                  </div>
                </StepPanel>
              )}

              {step === 3 && (
                <StepPanel
                  title="Logo de tu negocio (opcional)"
                  description="Sube tu logo para que aparezca en la barra lateral. Si no tienes logo, puedes seguir sin problema."
                >
                  <LogoStep
                    businessName={businessName}
                    preview={logoPreview}
                    onChange={(file, dataUrl) => {
                      setLogoFile(file);
                      setLogoPreview(dataUrl);
                    }}
                  />
                </StepPanel>
              )}

              {step === 4 && (
                <StepPanel
                  title="Etapas de tu pipeline"
                  description="Estas son las columnas que verás en tu pipeline. Puedes editarlas después."
                >
                  <StagesEditor stages={stages} onChange={setStages} />
                </StepPanel>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="ghost"
              onClick={back}
              disabled={step === 0 || isPending}
            >
              <ArrowLeft className="h-4 w-4" /> Atrás
            </Button>
            {step < totalSteps - 1 ? (
              <Button onClick={next} disabled={!canNext || isPending}>
                Siguiente <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={finish} disabled={!canNext || isPending}>
                {isPending ? "Guardando…" : "Finalizar"}
                <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground mt-6">
        100% local · Tus datos nunca salen de este equipo
      </p>
    </div>
  );
}

function StepPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
        {title}
      </h1>
      <p className="text-muted-foreground mt-2">{description}</p>
      <div className="mt-6 space-y-2">{children}</div>
    </div>
  );
}

function LogoStep({
  businessName,
  preview,
  onChange,
}: {
  businessName: string;
  preview: string | null;
  onChange: (file: File | null, dataUrl: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const ALLOWED = "image/png,image/jpeg,image/webp,image/svg+xml";

  const handleFile = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen es muy grande (máx 2 MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(file, String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 rounded-2xl border-2 border-dashed border-border bg-background flex items-center justify-center overflow-hidden shrink-0">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Logo"
              className="h-full w-full object-contain p-1.5"
            />
          ) : (
            <span className="text-3xl font-bold text-primary">
              {businessName.charAt(0).toUpperCase() || "?"}
            </span>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {preview ? "Cambiar logo" : "Subir logo"}
          </Button>
          {preview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => onChange(null, null)}
            >
              <Trash2 className="h-4 w-4" /> Quitar
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            PNG, JPG, WEBP o SVG · máximo 2 MB.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg p-3">
        <ImageIcon className="h-3.5 w-3.5" />
        Si saltas este paso, verás la inicial &quot;
        {businessName.charAt(0).toUpperCase() || "?"}
        &quot; en el sidebar. Puedes subir un logo después desde Ajustes.
      </div>
    </div>
  );
}

function StagesEditor({
  stages,
  onChange,
}: {
  stages: StageDraft[];
  onChange: (v: StageDraft[]) => void;
}) {
  const update = (i: number, patch: Partial<StageDraft>) => {
    onChange(stages.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };
  const remove = (i: number) => {
    onChange(stages.filter((_, idx) => idx !== i));
  };
  const add = () => {
    onChange([
      ...stages,
      { name: "Nueva etapa", color: COLORS[stages.length % COLORS.length], kind: "open" },
    ]);
  };
  return (
    <div className="space-y-2 mt-4">
      {stages.map((s, i) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded-lg border border-border bg-background p-2"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
          <input
            type="color"
            value={s.color}
            onChange={(e) => update(i, { color: e.target.value })}
            className="h-8 w-8 rounded-md border border-border shrink-0 cursor-pointer"
          />
          <input
            type="text"
            value={s.name}
            onChange={(e) => update(i, { name: e.target.value })}
            className="flex-1 min-w-0 bg-transparent border-0 px-2 py-1 text-sm focus:outline-none focus:ring-0"
            placeholder="Nombre"
          />
          <select
            value={s.kind}
            onChange={(e) =>
              update(i, {
                kind: e.target.value as "open" | "won" | "lost",
              })
            }
            className="text-xs bg-transparent border border-border rounded-md px-2 py-1"
          >
            <option value="open">Abierta</option>
            <option value="won">Ganado</option>
            <option value="lost">Perdido</option>
          </select>
          <button
            type="button"
            onClick={() => remove(i)}
            disabled={stages.length <= 1}
            className="text-muted-foreground hover:text-destructive disabled:opacity-30 p-1"
            aria-label="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="h-4 w-4" /> Agregar etapa
      </Button>
    </div>
  );
}
