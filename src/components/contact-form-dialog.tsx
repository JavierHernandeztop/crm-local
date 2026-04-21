"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Contact, Stage } from "@/lib/types";
import { createContact, updateContact } from "@/lib/actions/contacts";
import { createNote } from "@/lib/actions/notes";

const SOURCE_SUGGESTIONS = [
  "Instagram",
  "Facebook",
  "Referido",
  "Google",
  "WhatsApp",
  "Tienda física",
  "Web",
  "Otro",
];

export function ContactFormDialog({
  stages,
  contact,
  trigger,
  defaultStageId,
  open: openProp,
  onOpenChange,
}: {
  stages: Stage[];
  contact?: Contact;
  trigger?: React.ReactNode;
  defaultStageId?: number;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [isPending, startTransition] = useTransition();

  const isEdit = !!contact;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const initialNote = String(formData.get("initial_note") || "").trim();
    startTransition(async () => {
      try {
        if (isEdit && contact) {
          await updateContact(contact.id, formData);
          toast.success("Contacto actualizado");
        } else {
          const { id } = await createContact(formData);
          if (initialNote) {
            const nfd = new FormData();
            nfd.set("contact_id", String(id));
            nfd.set("body", initialNote);
            await createNote(nfd);
          }
          toast.success("Contacto creado");
        }
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button>
              {isEdit ? (
                <>
                  <Pencil /> Editar contacto
                </>
              ) : (
                <>
                  <Plus /> Nuevo contacto
                </>
              )}
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar contacto" : "Nuevo contacto"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza los datos de este contacto."
              : "Agrega un nuevo lead a tu pipeline."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" required>
              <Input
                name="name"
                required
                defaultValue={contact?.name ?? ""}
                placeholder="María García"
                autoFocus
              />
            </Field>
            <Field label="Teléfono">
              <Input
                name="phone"
                type="tel"
                defaultValue={contact?.phone ?? ""}
                placeholder="+52 55 1234 5678"
              />
            </Field>
            <Field label="Email">
              <Input
                name="email"
                type="email"
                defaultValue={contact?.email ?? ""}
                placeholder="maria@correo.com"
              />
            </Field>
            <Field label="Instagram">
              <Input
                name="instagram"
                defaultValue={contact?.instagram ?? ""}
                placeholder="@usuario"
              />
            </Field>
            <Field label="Fuente del lead">
              <Input
                name="source"
                defaultValue={contact?.source ?? ""}
                placeholder="Instagram, Referido…"
                list="source-suggestions"
              />
              <datalist id="source-suggestions">
                {SOURCE_SUGGESTIONS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </Field>
            <Field label="Etapa">
              <Select
                name="stage_id"
                defaultValue={String(
                  contact?.stage_id ??
                    defaultStageId ??
                    stages[0]?.id ??
                    "",
                )}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Etapa" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          {!isEdit && (
            <Field label="Nota inicial (opcional)">
              <Textarea
                name="initial_note"
                placeholder="Ej: Contactó por Instagram preguntando por el paquete básico."
              />
            </Field>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear contacto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}
