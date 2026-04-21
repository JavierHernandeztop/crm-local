"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "motion/react";
import {
  AtSign,
  Mail,
  Phone,
  Plus,
  GripVertical,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ContactFormDialog } from "@/components/contact-form-dialog";
import { WhatsAppLink } from "@/components/whatsapp-link";
import { cn, daysSince } from "@/lib/utils";
import { moveContactToStage } from "@/lib/actions/contacts";
import type { ContactWithStage, Stage } from "@/lib/types";

type ColumnData = { stage: Stage; contacts: ContactWithStage[] };

export function KanbanBoard({
  stages,
  contactsByStage,
}: {
  stages: Stage[];
  contactsByStage: ColumnData[];
}) {
  const router = useRouter();
  const [columns, setColumns] = useState<ColumnData[]>(contactsByStage);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
  );

  const findCard = (id: number): {
    columnIndex: number;
    cardIndex: number;
    card: ContactWithStage;
  } | null => {
    for (let i = 0; i < columns.length; i++) {
      const idx = columns[i].contacts.findIndex((c) => c.id === id);
      if (idx !== -1)
        return {
          columnIndex: i,
          cardIndex: idx,
          card: columns[i].contacts[idx],
        };
    }
    return null;
  };

  const findColumn = (id: string | number): number => {
    if (typeof id === "string" && id.startsWith("col-")) {
      const stageId = Number(id.replace("col-", ""));
      return columns.findIndex((c) => c.stage.id === stageId);
    }
    const n = Number(id);
    const res = findCard(n);
    return res ? res.columnIndex : -1;
  };

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(Number(e.active.id));
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;

    const activeCardId = Number(active.id);
    const activeInfo = findCard(activeCardId);
    if (!activeInfo) return;

    const overId = over.id;
    const toColIdx = findColumn(overId);
    if (toColIdx === -1) return;

    const fromColIdx = activeInfo.columnIndex;
    const toColumn = columns[toColIdx];

    let newIndex: number;
    if (typeof overId === "string" && overId.startsWith("col-")) {
      // Dropped on column (empty or at end)
      newIndex = toColumn.contacts.length;
      if (fromColIdx === toColIdx) {
        newIndex = Math.max(0, newIndex - 1);
      }
    } else {
      const overInfo = findCard(Number(overId));
      if (!overInfo) return;
      newIndex = overInfo.cardIndex;
    }

    // Optimistic update
    setColumns((prev) => {
      const next = prev.map((c) => ({ ...c, contacts: [...c.contacts] }));
      const [moved] = next[fromColIdx].contacts.splice(activeInfo.cardIndex, 1);
      const movedUpdated: ContactWithStage = {
        ...moved,
        stage_id: next[toColIdx].stage.id,
        stage_name: next[toColIdx].stage.name,
        stage_color: next[toColIdx].stage.color,
        stage_is_won: next[toColIdx].stage.is_won,
        stage_is_lost: next[toColIdx].stage.is_lost,
      };
      if (fromColIdx === toColIdx) {
        next[toColIdx].contacts = arrayMove(
          [...next[fromColIdx].contacts, movedUpdated],
          next[fromColIdx].contacts.length,
          newIndex,
        );
      } else {
        next[toColIdx].contacts.splice(newIndex, 0, movedUpdated);
      }
      return next;
    });

    startTransition(async () => {
      try {
        await moveContactToStage(
          activeCardId,
          toColumn.stage.id,
          newIndex,
        );
        if (fromColIdx !== toColIdx && toColumn.stage.is_won === 1) {
          toast.success(
            `¡${activeInfo.card.name} cerrado!`,
            {
              description: "No olvides registrar el pago.",
              action: {
                label: "Registrar pago",
                onClick: () => {
                  window.location.href = `/contactos/${activeCardId}`;
                },
              },
            },
          );
        } else {
          toast.success("Movido");
        }
        router.refresh();
      } catch {
        toast.error("No se pudo mover");
        router.refresh();
      }
    });
  };

  const activeCard = activeId ? findCard(activeId)?.card : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 snap-x">
        {columns.map((col) => (
          <KanbanColumn key={col.stage.id} column={col} allStages={stages} />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 240, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }}>
        {activeCard ? (
          <motion.div
            initial={{ scale: 1, rotate: 0 }}
            animate={{ scale: 1.03, rotate: 2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Card contact={activeCard} isOverlay />
          </motion.div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  column,
  allStages,
}: {
  column: ColumnData;
  allStages: Stage[];
}) {
  const total = column.contacts.length;

  return (
    <div className="w-[300px] shrink-0 snap-start flex flex-col bg-muted/30 rounded-xl border border-border">
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: column.stage.color }}
        />
        <span className="font-medium text-sm truncate flex-1">
          {column.stage.name}
        </span>
        <span className="text-xs text-muted-foreground font-medium bg-background rounded-full px-2 py-0.5">
          {total}
        </span>
      </div>
      <div
        id={`col-${column.stage.id}`}
        data-column-id={`col-${column.stage.id}`}
        className="flex-1 min-h-24"
      >
        <SortableContext
          id={`col-${column.stage.id}`}
          items={column.contacts.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <DroppableColumnArea stageId={column.stage.id}>
            <AnimatePresence initial={false} mode="popLayout">
              {column.contacts.map((c) => (
                <SortableCard key={c.id} contact={c} />
              ))}
            </AnimatePresence>
            {column.contacts.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-6 italic">
                Suelta una tarjeta aquí
              </div>
            )}
          </DroppableColumnArea>
        </SortableContext>
      </div>
      <div className="p-2 border-t border-border">
        <ContactFormDialog
          stages={allStages}
          defaultStageId={column.stage.id}
          trigger={
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground"
            >
              <Plus className="h-4 w-4" /> Agregar contacto
            </Button>
          }
        />
      </div>
    </div>
  );
}

function DroppableColumnArea({
  stageId,
  children,
}: {
  stageId: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${stageId}` });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "p-2 space-y-2 min-h-[120px] transition-colors rounded-b-xl",
        isOver && "bg-accent/50",
      )}
    >
      {children}
    </div>
  );
}

function SortableCard({ contact }: { contact: ContactWithStage }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: contact.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none"
      initial={{ opacity: 0, y: -6, scale: 0.97 }}
      animate={{ opacity: isDragging ? 0.4 : 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.12 } }}
      transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.6 }}
      layout={!isDragging}
    >
      <Card contact={contact} />
    </motion.div>
  );
}

function Card({
  contact,
  isOverlay,
}: {
  contact: ContactWithStage;
  isOverlay?: boolean;
}) {
  const days = daysSince(contact.last_contacted_at ?? contact.created_at);
  const stale =
    !contact.stage_is_won &&
    !contact.stage_is_lost &&
    (days ?? 0) >= 3;

  return (
    <div
      className={cn(
        "bg-card rounded-lg border border-border p-3 shadow-xs cursor-grab active:cursor-grabbing group",
        !isOverlay && "brand-glow",
        isOverlay && "shadow-xl ring-2 ring-primary/40",
        stale && "border-destructive/40",
      )}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-sm truncate">{contact.name}</h3>
            <div className="flex items-center gap-1.5 shrink-0">
              {contact.phone && !isOverlay && (
                <WhatsAppLink phone={contact.phone} size={16} />
              )}
              <Link
                href={`/contactos/${contact.id}`}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Ver detalle"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
          {(contact.phone || contact.email || contact.instagram) && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-xs text-muted-foreground">
              {contact.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                </span>
              )}
              {contact.email && (
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                </span>
              )}
              {contact.instagram && (
                <span className="inline-flex items-center gap-1">
                  <AtSign className="h-3 w-3" /> {contact.instagram}
                </span>
              )}
            </div>
          )}
          <div className="flex items-center justify-between mt-2 gap-2">
            {contact.source && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground truncate">
                {contact.source}
              </span>
            )}
            <span
              className={cn(
                "text-[10px] ml-auto shrink-0",
                stale ? "text-destructive font-medium" : "text-muted-foreground",
              )}
            >
              {contact.last_contacted_at ? `${days ?? 0}d` : "nuevo"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
