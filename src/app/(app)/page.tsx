export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowRight, DollarSign, TrendingUp, Users, Target } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getDashboardMetrics,
  getSettings,
  listClosedClients,
  listStaleContacts,
} from "@/lib/queries";
import { formatDate, formatMoney } from "@/lib/utils";
import { LeadsBySourceChart } from "@/components/charts/leads-by-source";
import { SalesByMonthChart } from "@/components/charts/sales-by-month";
import { CountUp } from "@/components/count-up";

export default function DashboardPage() {
  const metrics = getDashboardMetrics();
  const settings = getSettings();
  const closed = listClosedClients().slice(0, 5);
  const stale = listStaleContacts();

  return (
    <div className="space-y-6 animate-in-fade">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Hola, {settings.business_name}
        </h1>
        <p className="text-muted-foreground mt-1">
          Aquí está el resumen de tu negocio hoy.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total vendido"
          value={
            <CountUp
              value={metrics.totalSold}
              currency={settings.currency}
            />
          }
          icon={<DollarSign className="h-4 w-4" />}
        />
        <MetricCard
          label="Clientes activos"
          value={<CountUp value={metrics.activeClients} />}
          icon={<Users className="h-4 w-4" />}
        />
        <MetricCard
          label="Tasa de cierre"
          value={
            <CountUp value={metrics.closeRate * 100} suffix="%" />
          }
          icon={<Target className="h-4 w-4" />}
          hint="Cerrados ganados sobre cerrados totales"
        />
        <MetricCard
          label="Total de leads"
          value={<CountUp value={metrics.totalLeads} />}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Ventas por mes</CardTitle>
            <CardDescription>
              Evolución mensual de ingresos cerrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.salesByMonth.length === 0 ? (
              <EmptyState text="Aún no hay ventas registradas." />
            ) : (
              <SalesByMonthChart
                data={metrics.salesByMonth}
                currency={settings.currency}
              />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Leads por fuente</CardTitle>
            <CardDescription>De dónde vienen tus clientes</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.leadsBySource.length === 0 ? (
              <EmptyState text="Aún no hay leads registrados." />
            ) : (
              <LeadsBySourceChart data={metrics.leadsBySource} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Últimos cierres</CardTitle>
              <CardDescription>
                Clientes que ganaste recientemente
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/clientes">
                Ver todos <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {closed.length === 0 ? (
              <EmptyState text="Aún no hay clientes cerrados." />
            ) : (
              <ul className="divide-y divide-border">
                {closed.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/contactos/${c.id}`}
                        className="font-medium hover:underline truncate block"
                      >
                        {c.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {c.payment
                          ? `${c.payment.method} · ${formatDate(c.payment.paid_at)}`
                          : "Sin pago registrado"}
                      </div>
                    </div>
                    <div className="text-right font-semibold">
                      {c.payment
                        ? formatMoney(c.payment.amount, c.payment.currency)
                        : "—"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Seguimientos pendientes</CardTitle>
              <CardDescription>
                Leads que no has contactado últimamente
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/contactos">
                Ir a contactos <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <StaleStat count={stale.day1.length} label="1–3 días" tone="muted" />
              <StaleStat count={stale.day3.length} label="3–7 días" tone="warning" />
              <StaleStat count={stale.day7.length} label="7+ días" tone="destructive" />
            </div>
            {stale.total === 0 ? (
              <EmptyState text="¡Todo al día!" />
            ) : (
              <ul className="divide-y divide-border">
                {[...stale.day7, ...stale.day3, ...stale.day1]
                  .slice(0, 5)
                  .map((c) => (
                    <li key={c.id} className="py-2.5 first:pt-0 last:pb-0">
                      <Link
                        href={`/contactos/${c.id}`}
                        className="flex items-center justify-between hover:underline"
                      >
                        <span className="truncate">{c.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {c.stage_name}
                        </span>
                      </Link>
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-muted-foreground">{icon}</span>
        </div>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {hint && (
          <p className="text-xs text-muted-foreground mt-1">{hint}</p>
        )}
      </CardContent>
    </Card>
  );
}

function StaleStat({
  count,
  label,
  tone,
}: {
  count: number;
  label: string;
  tone: "muted" | "warning" | "destructive";
}) {
  const color = {
    muted: "text-foreground",
    warning: "text-warning",
    destructive: "text-destructive",
  }[tone];
  return (
    <div className="rounded-lg border border-border p-3 text-center">
      <div className={`text-xl font-semibold ${color}`}>{count}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
