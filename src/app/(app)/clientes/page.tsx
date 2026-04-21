export const dynamic = "force-dynamic";

import Link from "next/link";
import { Download, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listClosedClients, getSettings } from "@/lib/queries";
import { formatDate, formatMoney } from "@/lib/utils";

export default function ClosedClientsPage() {
  const clients = listClosedClients();
  const settings = getSettings();
  const totalSold = clients.reduce(
    (sum, c) => sum + (c.payment?.amount ?? 0),
    0,
  );

  return (
    <div className="space-y-6 animate-in-fade">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Clientes cerrados
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {clients.length} cliente{clients.length === 1 ? "" : "s"} · Total{" "}
            <span className="font-semibold text-foreground">
              {formatMoney(totalSold, settings.currency)}
            </span>
          </p>
        </div>
        {clients.length > 0 && (
          <Button asChild variant="outline">
            <a href="/api/export/clientes" download>
              <Download className="h-4 w-4" /> Exportar CSV
            </a>
          </Button>
        )}
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success mx-auto">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold">
                Aún no tienes clientes cerrados
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Cuando muevas un contacto a una etapa de ganado aparecerá aquí.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="hidden sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wide">
                    <th className="text-left font-medium py-3 px-4">Cliente</th>
                    <th className="text-left font-medium py-3 px-4">Producto / Servicio</th>
                    <th className="text-left font-medium py-3 px-4">Fecha</th>
                    <th className="text-left font-medium py-3 px-4">Método</th>
                    <th className="text-right font-medium py-3 px-4">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-border last:border-b-0 hover:bg-accent/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <Link
                          href={`/contactos/${c.id}`}
                          className="font-medium hover:underline"
                        >
                          {c.name}
                        </Link>
                        {c.source && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            · {c.source}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {c.payment?.service || "—"}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {c.payment
                          ? formatDate(c.payment.paid_at)
                          : "Pendiente"}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {c.payment?.method ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {c.payment
                          ? formatMoney(
                              c.payment.amount,
                              c.payment.currency,
                            )
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="sm:hidden divide-y divide-border">
              {clients.map((c) => (
                <li key={c.id} className="p-4">
                  <Link
                    href={`/contactos/${c.id}`}
                    className="font-medium hover:underline block"
                  >
                    {c.name}
                  </Link>
                  <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                    <span>
                      {c.payment
                        ? `${c.payment.method} · ${formatDate(c.payment.paid_at)}`
                        : "Pago pendiente"}
                    </span>
                    <span className="font-semibold text-foreground">
                      {c.payment
                        ? formatMoney(c.payment.amount, c.payment.currency)
                        : "—"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
