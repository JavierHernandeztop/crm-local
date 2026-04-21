"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquarePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { createNote, deleteNote } from "@/lib/actions/notes";
import type { Note } from "@/lib/types";

export function NotesSection({
  contactId,
  notes,
}: {
  contactId: number;
  notes: Note[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("contact_id", String(contactId));
    const body = String(fd.get("body") || "").trim();
    if (!body) return;
    startTransition(async () => {
      try {
        await createNote(fd);
        formRef.current?.reset();
        toast.success("Nota agregada");
        router.refresh();
      } catch {
        toast.error("No se pudo agregar la nota");
      }
    });
  };

  const handleDelete = (id: number) => {
    startTransition(async () => {
      await deleteNote(id);
      toast.success("Nota eliminada");
      router.refresh();
    });
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquarePlus className="h-4 w-4" />
          <h2 className="font-semibold">Historial de interacciones</h2>
          <span className="ml-auto text-xs text-muted-foreground">
            {notes.length} nota{notes.length === 1 ? "" : "s"}
          </span>
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="space-y-2"
        >
          <Textarea
            name="body"
            placeholder="Ej: Llamada de 15 min, le envié la propuesta por WhatsApp."
            required
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending} size="sm">
              {isPending ? "Agregando…" : "Agregar nota"}
            </Button>
          </div>
        </form>

        {notes.length === 0 ? (
          <div className="border border-dashed border-border rounded-lg py-8 text-center text-sm text-muted-foreground">
            Aún no hay notas. Agrega la primera interacción arriba.
          </div>
        ) : (
          <ol className="space-y-4 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-border">
            {notes.map((n) => (
              <li
                key={n.id}
                className="relative pl-7 group"
              >
                <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full bg-background border-2 border-primary" />
                <div className="flex items-center justify-between gap-2">
                  <time className="text-xs text-muted-foreground">
                    {formatDateTime(n.created_at)}
                  </time>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(n.id)}
                    aria-label="Eliminar nota"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
                <div className="text-sm whitespace-pre-wrap mt-1">
                  {n.body}
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
