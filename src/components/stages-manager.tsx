"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Pencil,
  Plus,
  Trash2,
  Trophy,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  createStage,
  updateStage,
  deleteStage,
  reorderStages,
} from "@/lib/actions/stages";
import type { Stage } from "@/lib/types";

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

export function StagesManager({ stages }: { stages: Stage[] }) {
  const router = useRouter();
  const [items, setItems] = useState(stages);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((s) => s.id === Number(active.id));
    const newIndex = items.findIndex((s) => s.id === Number(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    startTransition(async () => {
      await reorderStages(next.map((s) => s.id));
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-2">
            {items.map((s) => (
              <SortableStageRow key={s.id} stage={s} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <StageFormDialog
        trigger={
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4" /> Nueva etapa
          </Button>
        }
      />
    </div>
  );
}

function SortableStageRow({ stage }: { stage: Stage }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [, startTransition] = useTransition();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteStage(stage.id);
        toast.success("Etapa eliminada");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error");
      }
    });
  };

  return (
    <li ref={setNodeRef} style={style}>
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
          aria-label="Arrastrar"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span
          className="h-3 w-3 rounded-full shrink-0"
          style={{ backgroundColor: stage.color }}
        />
        <span className="flex-1 font-medium truncate">{stage.name}</span>
        {stage.is_won === 1 && (
          <span className="inline-flex items-center gap-1 text-xs text-success">
            <Trophy className="h-3 w-3" /> Ganado
          </span>
        )}
        {stage.is_lost === 1 && (
          <span className="inline-flex items-center gap-1 text-xs text-destructive">
            <XCircle className="h-3 w-3" /> Perdido
          </span>
        )}
        <StageFormDialog
          stage={stage}
          trigger={
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Pencil className="h-4 w-4" />
            </Button>
          }
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive"
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar etapa?</AlertDialogTitle>
            <AlertDialogDescription>
              No podrás eliminar una etapa que tenga contactos. Muévelos a otra
              etapa primero.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:opacity-90"
              onClick={handleDelete}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}

function StageFormDialog({
  stage,
  trigger,
}: {
  stage?: Stage;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(stage?.color ?? COLORS[0]);
  const [status, setStatus] = useState<"open" | "won" | "lost">(
    stage?.is_won ? "won" : stage?.is_lost ? "lost" : "open",
  );
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("color", color);
    fd.set("is_won", status === "won" ? "1" : "0");
    fd.set("is_lost", status === "lost" ? "1" : "0");
    startTransition(async () => {
      try {
        if (stage) await updateStage(stage.id, fd);
        else await createStage(fd);
        toast.success(stage ? "Etapa actualizada" : "Etapa creada");
        setOpen(false);
        router.refresh();
      } catch {
        toast.error("Error al guardar");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {stage ? "Editar etapa" : "Nueva etapa"}
          </DialogTitle>
          <DialogDescription>
            Las etapas organizan tu pipeline de ventas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input
              name="name"
              defaultValue={stage?.name ?? ""}
              placeholder="Ej: Propuesta enviada"
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? "var(--foreground)" : "transparent",
                  }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { v: "open", label: "Abierta" },
                  { v: "won", label: "Ganado" },
                  { v: "lost", label: "Perdido" },
                ] as const
              ).map((t) => (
                <button
                  key={t.v}
                  type="button"
                  onClick={() => setStatus(t.v)}
                  className={`rounded-md border border-border px-3 py-1.5 text-sm transition-colors ${
                    status === t.v
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-accent"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Las etapas &quot;ganado&quot; registran pagos. Las &quot;perdido&quot;
              excluyen del pipeline activo.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando…" : stage ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
