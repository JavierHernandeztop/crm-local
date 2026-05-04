export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  DollarSign,
  Inbox,
  PieChart,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
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
              <EmptyState
                icon={<TrendingUp className="h-7 w-7" strokeWidth={1.5} />}
                title="Tu primera venta está cerca"
                text="Cuando registres pagos verás aquí tu evolución mensual."
              />
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
              <EmptyState
                icon={<PieChart className="h-7 w-7" strokeWidth={1.5} />}
                title="Aún no hay leads"
                text="Agrega tu primer contacto para empezar a medir."
              />
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
              <EmptyState
                icon={<Inbox className="h-7 w-7" strokeWidth={1.5} />}
                title="Aún sin cierres"
                text="El primer cliente cerrado aparecerá aquí."
              />
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
              <EmptyState
                icon={<CheckCircle2 className="h-7 w-7" strokeWidth={1.5} />}
                title="¡Todo al día!"
                text="Ningún lead te está esperando."
              />
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
    <Card className="border border-white/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/10">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-400 tracking-wide">{label}</span>
          <span className="bg-white/5 rounded-full p-2 text-muted-foreground">
            {icon}
          </span>
        </div>
        <div className="text-2xl font-bold tracking-tight tabular-nums">
          {value}
        </div>
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

function EmptyState({
  text,
  title,
  icon,
}: {
  text: string;
  title?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="py-8 text-center flex flex-col items-center gap-2">
      {icon && (
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent/40 text-muted-foreground/70">
          {icon}
        </div>
      )}
      {title && (
        <p className="text-sm font-medium text-foreground">{title}</p>
      )}
      <p className="text-xs text-muted-foreground max-w-xs">{text}</p>
    </div>
  );
}
