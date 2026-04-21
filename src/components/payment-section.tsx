"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatDate, formatMoney } from "@/lib/utils";
import { upsertPayment } from "@/lib/actions/payments";
import type { ContactWithStage, Payment, Stage } from "@/lib/types";

const METHODS = [
  "Transferencia",
  "Efectivo",
  "Tarjeta",
  "PayPal",
  "Stripe",
  "Mercado Pago",
  "Otro",
];

export function PaymentSection({
  contact,
  payment,
  stages,
  defaultCurrency,
}: {
  contact: ContactWithStage;
  payment: Payment | null;
  stages: Stage[];
  defaultCurrency: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("contact_id", String(contact.id));
    startTransition(async () => {
      try {
        await upsertPayment(fd);
        toast.success("Pago guardado");
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-success/15 text-success flex items-center justify-center">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">Cliente cerrado</h2>
              <p className="text-xs text-muted-foreground">
                Datos de cierre y pago
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(true)}
          >
            <Pencil className="h-4 w-4" />
            {payment ? "Editar pago" : "Registrar pago"}
          </Button>
        </div>

        {payment ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
            <Stat
              label="Monto"
              value={formatMoney(payment.amount, payment.currency)}
            />
            <Stat label="Método" value={payment.method} />
            <Stat
              label="Fecha de cierre"
              value={formatDate(payment.paid_at)}
            />
            {payment.service && (
              <Stat
                label="Producto / Servicio"
                value={payment.service}
                className="col-span-2 sm:col-span-3"
              />
            )}
            {payment.notes && (
              <div className="col-span-2 sm:col-span-3 text-sm text-muted-foreground whitespace-pre-wrap border-t border-border pt-4 mt-2">
                {payment.notes}
              </div>
            )}
          </div>
        ) : (
          <div className="border border-dashed border-border rounded-lg py-6 text-center text-sm text-muted-foreground mt-4">
            Aún no has registrado el pago de este cliente.
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {payment ? "Editar pago" : "Registrar pago"}
              </DialogTitle>
              <DialogDescription>
                Datos del cierre con {contact.name}.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Monto</Label>
                  <Input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    defaultValue={payment?.amount ?? ""}
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Moneda</Label>
                  <Input
                    name="currency"
                    defaultValue={payment?.currency ?? defaultCurrency}
                    placeholder="USD"
                    maxLength={4}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Método de pago</Label>
                  <Select
                    name="method"
                    defaultValue={payment?.method ?? METHODS[0]}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {METHODS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Fecha de cierre</Label>
                  <Input
                    name="paid_at"
                    type="date"
                    required
                    defaultValue={
                      payment?.paid_at
                        ? payment.paid_at.slice(0, 10)
                        : new Date().toISOString().slice(0, 10)
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Notas (opcional)</Label>
                <Textarea
                  name="notes"
                  defaultValue={payment?.notes ?? ""}
                  placeholder="Ej: Pagó 50% al inicio, resto al entregar."
                />
              </div>
              <input
                type="hidden"
                name="stage_id"
                value={
                  contact.stage_is_won
                    ? contact.stage_id
                    : (stages.find((s) => s.is_won === 1)?.id ?? "")
                }
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Guardando…" : "Guardar pago"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold mt-0.5">{value}</div>
    </div>
  );
}
