import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  DollarSign,
  Flag,
  GaugeCircle,
  Info,
  MessageSquare,
  Timer,
  TrendingDown,
  Zap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getAbandonedRate,
  getAvgDealSize,
  getAvgFirstResponseTime,
  getAvgNotesPerWin,
  getAvgTimeToClose,
  getFunnel,
  getLossByStage,
  getMonthlyRevenue,
  getOverallCloseRate,
  getProjectedRevenue,
  getStageVelocity,
  getStuckLeads,
  getWeeklyNewLeads,
} from "@/lib/analytics";
import { getSettings } from "@/lib/queries";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { StageVelocityChart } from "@/components/charts/stage-velocity";
import { FunnelChart } from "@/components/charts/funnel";
import { WeeklyLeadsChart } from "@/components/charts/weekly-leads";
import { LossByStageChart } from "@/components/charts/loss-by-stage";
import { SalesByMonthChart } from "@/components/charts/sales-by-month";

export const dynamic = "force-dynamic";

export default function AnalyticsPage() {
  const settings = getSettings();
  const velocity = getStageVelocity();
  const timeToClose = getAvgTimeToClose();
  const stuck = getStuckLeads(5);
  const funnel = getFunnel();
  const losses = getLossByStage();
  const closeRate = getOverallCloseRate();
  const weeklyLeads = getWeeklyNewLeads(12);
  const monthlyRev = getMonthlyRevenue(12);
  const avgDeal = getAvgDealSize();
  const projected = getProjectedRevenue();
  const avgNotesWin = getAvgNotesPerWin();
  const firstResponse = getAvgFirstResponseTime();
  const abandoned = getAbandonedRate();

  const bottleneck = velocity
    .filter((v) => !v.is_won && !v.is_lost && v.sample_size > 0)
    .sort((a, b) => b.avg_days - a.avg_days)[0];

  return (
    <div className="space-y-8 animate-in-fade">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Analítica
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Identifica cuellos de botella, mide conversión y proyecta ingresos.
        </p>
      </div>

      {/* Stuck leads — most prominent, first */}
      <Section
        title="Leads estancados"
        description="Contactos en la misma etapa por más de 5 días. Son lo más accionable: contáctalos hoy o muévelos."
        icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
      >
        {stuck.length === 0 ? (
          <EmptyNote text="Ningún lead estancado. Seguimiento al día. 👌" />
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {stuck.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/contactos/${l.id}`}
                  className="flex items-center justify-between gap-3 p-3 sm:p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{l.name}</span>
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: `${l.stage_color}20`,
                          color: l.stage_color,
                        }}
                      >
                        {l.stage_name}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Sin movimiento desde {formatDateTime(l.last_stage_change)}
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-3">
                    <div>
                      <div className="text-lg font-semibold text-destructive tabular-nums">
                        {Math.floor(l.days_in_stage)}d
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        estancado
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Pipeline velocity */}
      <Section
        title="Velocidad del Pipeline"
        description="Cuánto tarda un lead en cada etapa. La barra en rojo es tu cuello de botella."
        icon={<Timer className="h-4 w-4" />}
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Tiempo promedio por etapa</CardTitle>
              <InfoText
                text={
                  bottleneck
                    ? `Tu cuello de botella es "${bottleneck.stage_name}" con ${bottleneck.avg_days.toFixed(1)} días en promedio. Si sube, revisa tu script o tu velocidad de respuesta en esa etapa.`
                    : "A medida que muevas contactos entre etapas verás aquí tu tiempo promedio."
                }
              />
            </CardHeader>
            <CardContent>
              <StageVelocityChart data={velocity} />
            </CardContent>
          </Card>
          <div className="space-y-4">
            <StatCard
              icon={<Clock className="h-4 w-4" />}
              label="Tiempo promedio a cerrar"
              value={
                timeToClose.sample_size > 0
                  ? `${timeToClose.days.toFixed(1)} días`
                  : "—"
              }
              hint={
                timeToClose.sample_size > 0
                  ? `Basado en ${timeToClose.sample_size} cierre${timeToClose.sample_size === 1 ? "" : "s"}.`
                  : "Aún no hay cierres registrados."
              }
            />
            <StatCard
              icon={<Zap className="h-4 w-4" />}
              label="Leads estancados"
              value={String(stuck.length)}
              hint={
                stuck.length === 0
                  ? "Todos tus leads tienen movimiento reciente."
                  : `${stuck.length} lead${stuck.length === 1 ? "" : "s"} sin mover más de 5 días.`
              }
              tone={stuck.length > 0 ? "warning" : "ok"}
            />
          </div>
        </div>
      </Section>

      {/* Conversion */}
      <Section
        title="Tasas de Conversión"
        description="Cuántos leads pasan de una etapa a la siguiente, y dónde se te escapan."
        icon={<GaugeCircle className="h-4 w-4" />}
      >
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">Embudo de conversión</CardTitle>
              <InfoText text="Porcentaje de leads que llegan a cada etapa, usando la primera etapa como 100%. Una caída grande entre dos etapas consecutivas te dice dónde enfocar mejoras." />
            </CardHeader>
            <CardContent>
              <FunnelChart data={funnel} />
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Tasa de cierre general</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold tabular-nums">
                  {(closeRate.rate * 100).toFixed(0)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {closeRate.won} ganados de {closeRate.total} leads totales.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base inline-flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  Dónde se pierden
                </CardTitle>
                <InfoText text="Etapa desde la que los leads se movieron a 'Perdido'. El objetivo es que esta lista esté lo más balanceada posible." />
              </CardHeader>
              <CardContent>
                <LossByStageChart data={losses} />
              </CardContent>
            </Card>
          </div>
        </div>
      </Section>

      {/* Volume & revenue */}
      <Section
        title="Volumen y Revenue"
        description="Cómo entran leads y cómo se cierra el dinero."
        icon={<DollarSign className="h-4 w-4" />}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatCard
            icon={<DollarSign className="h-4 w-4" />}
            label="Valor promedio por cierre"
            value={
              avgDeal.count > 0
                ? formatMoney(avgDeal.avg, avgDeal.currency)
                : "—"
            }
            hint={
              avgDeal.count > 0
                ? `Sobre ${avgDeal.count} cierre${avgDeal.count === 1 ? "" : "s"}.`
                : "Registra pagos para ver este dato."
            }
          />
          <StatCard
            icon={<Flag className="h-4 w-4" />}
            label="Revenue proyectado"
            value={formatMoney(projected.projected, settings.currency)}
            hint={`${projected.active_leads} leads activos × ${(projected.close_rate * 100).toFixed(0)}% × valor promedio.`}
          />
          <StatCard
            icon={<MessageSquare className="h-4 w-4" />}
            label="Notas por cierre exitoso"
            value={
              avgNotesWin.sample_size > 0
                ? avgNotesWin.avg.toFixed(1)
                : "—"
            }
            hint={
              avgNotesWin.sample_size > 0
                ? "Cuántas interacciones en promedio antes de ganar."
                : "Aún sin cierres."
            }
          />
          <StatCard
            icon={<Clock className="h-4 w-4" />}
            label="Primera respuesta"
            value={
              firstResponse.sample_size > 0
                ? `${firstResponse.days.toFixed(1)} días`
                : "—"
            }
            hint="Entre la entrada del lead y tu primera nota. Cuanto menor, mejor."
            tone={
              firstResponse.sample_size > 0 && firstResponse.days > 1
                ? "warning"
                : "ok"
            }
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Nuevos leads por semana
              </CardTitle>
              <InfoText text="Últimas 12 semanas. Te ayuda a ver si tus esfuerzos de captación están funcionando o están muriendo." />
            </CardHeader>
            <CardContent>
              <WeeklyLeadsChart data={weeklyLeads} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue por mes</CardTitle>
              <InfoText text="Total cobrado por mes de cierre. Útil para detectar estacionalidad." />
            </CardHeader>
            <CardContent>
              {monthlyRev.length === 0 ? (
                <EmptyNote text="Aún no hay pagos registrados." />
              ) : (
                <SalesByMonthChart
                  data={monthlyRev.map((m) => ({
                    month: m.month,
                    total: m.total,
                  }))}
                  currency={settings.currency}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Quality */}
      <Section
        title="Calidad del Seguimiento"
        description="Qué tan bien cuidas tus leads."
        icon={<MessageSquare className="h-4 w-4" />}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={<MessageSquare className="h-4 w-4" />}
            label="Notas promedio antes de cerrar"
            value={
              avgNotesWin.sample_size > 0 ? avgNotesWin.avg.toFixed(1) : "—"
            }
            hint="Menos notas no es bueno ni malo — compara con tu tasa de cierre."
          />
          <StatCard
            icon={<Clock className="h-4 w-4" />}
            label="Tiempo a primera respuesta"
            value={
              firstResponse.sample_size > 0
                ? `${firstResponse.days.toFixed(1)}d`
                : "—"
            }
            hint="Responder el mismo día puede duplicar tu conversión."
            tone={
              firstResponse.sample_size > 0 && firstResponse.days > 1
                ? "warning"
                : "ok"
            }
          />
          <StatCard
            icon={<AlertTriangle className="h-4 w-4" />}
            label="Leads abandonados"
            value={`${(abandoned.rate * 100).toFixed(0)}%`}
            hint={`${abandoned.abandoned} de ${abandoned.total} leads sin una sola nota.`}
            tone={abandoned.rate > 0.2 ? "danger" : abandoned.rate > 0.1 ? "warning" : "ok"}
          />
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground shrink-0">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div>{children}</div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  tone = "ok",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: "ok" | "warning" | "danger";
}) {
  const valueClass =
    tone === "danger"
      ? "text-destructive"
      : tone === "warning"
        ? "text-warning"
        : "text-foreground";
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <span className="text-muted-foreground">{icon}</span>
        </div>
        <div className={`text-2xl font-semibold tabular-nums ${valueClass}`}>
          {value}
        </div>
        {hint && (
          <p className="text-xs text-muted-foreground mt-1">{hint}</p>
        )}
      </CardContent>
    </Card>
  );
}

function InfoText({ text }: { text: string }) {
  return (
    <CardDescription className="flex gap-2 items-start mt-1">
      <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
      <span>{text}</span>
    </CardDescription>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <div className="border border-dashed border-border rounded-lg py-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
