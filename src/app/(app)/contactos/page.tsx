import Link from "next/link";
import {
  AtSign,
  Mail,
  Phone,
  Sparkles,
  Users as UsersIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listContacts, listStages } from "@/lib/queries";
import { ContactFormDialog } from "@/components/contact-form-dialog";
import { ContactsSearch } from "@/components/contacts-search";
import { ContactRowActions } from "@/components/contact-row-actions";
import { ContactMobileItem, ContactRow } from "@/components/contact-row";
import { daysSince, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stage?: string }>;
}) {
  const sp = await searchParams;
  const stages = listStages();
  const stageId = sp.stage ? Number(sp.stage) : null;
  const contacts = listContacts({ search: sp.q, stageId });

  return (
    <div className="space-y-6 animate-in-fade">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Contactos
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {contacts.length} contacto{contacts.length === 1 ? "" : "s"}
          </p>
        </div>
        <ContactFormDialog stages={stages} />
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <ContactsSearch />
        <div className="flex flex-wrap gap-2">
          <StageFilter stages={stages} current={stageId} query={sp.q} />
        </div>
      </div>

      {contacts.length === 0 ? (
        <EmptyContacts hasFilter={!!sp.q || stageId != null} stagesCount={stages.length} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wide">
                    <th className="text-left font-medium py-3 px-4">
                      Nombre
                    </th>
                    <th className="text-left font-medium py-3 px-4">
                      Contacto
                    </th>
                    <th className="text-left font-medium py-3 px-4">Etapa</th>
                    <th className="text-left font-medium py-3 px-4">Fuente</th>
                    <th className="text-left font-medium py-3 px-4">
                      Días sin contacto
                    </th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c) => {
                    const reference = c.last_note_at ?? c.last_contacted_at ?? c.created_at;
                    const days = daysSince(reference);
                    const hasNote = c.last_note_at != null;
                    const hasAnyContact = hasNote || !!c.last_contacted_at;
                    const isClosed =
                      c.stage_is_won === 1 || c.stage_is_lost === 1;
                    const daysDanger =
                      hasAnyContact && !isClosed && (days ?? 0) >= 7;
                    return (
                      <ContactRow
                        key={c.id}
                        contactId={c.id}
                        className="border-b border-border last:border-b-0 transition-colors duration-150 cursor-pointer hover:bg-white/5"
                      >
                        <td className="py-3 px-4">
                          <Link
                            href={`/contactos/${c.id}`}
                            className="font-medium hover:underline"
                          >
                            {c.name}
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-0.5 text-muted-foreground text-xs">
                            {c.phone && (
                              <span className="flex items-center gap-1.5">
                                <Phone className="h-3 w-3" /> {c.phone}
                              </span>
                            )}
                            {c.email && (
                              <span className="flex items-center gap-1.5">
                                <Mail className="h-3 w-3" /> {c.email}
                              </span>
                            )}
                            {c.instagram && (
                              <span className="flex items-center gap-1.5">
                                <AtSign className="h-3 w-3" /> {c.instagram}
                              </span>
                            )}
                            {!c.phone && !c.email && !c.instagram && "—"}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: `${c.stage_color}20`,
                              color: c.stage_color,
                            }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: c.stage_color }}
                            />
                            {c.stage_name}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {c.source || "—"}
                        </td>
                        <td
                          className={cn(
                            "py-3 px-4 transition-colors",
                            daysDanger && "bg-red-500/10",
                          )}
                        >
                          <DaysWithoutContactBadge
                            days={days}
                            hasAnyContact={hasAnyContact}
                            isClosed={isClosed}
                          />
                        </td>
                        <td className="py-3 px-2">
                          <ContactRowActions contact={c} stages={stages} />
                        </td>
                      </ContactRow>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="md:hidden divide-y divide-border">
              {contacts.map((c) => {
                const reference = c.last_note_at ?? c.last_contacted_at ?? c.created_at;
                const days = daysSince(reference);
                const hasNote = c.last_note_at != null;
                return (
                  <ContactMobileItem
                    key={c.id}
                    contactId={c.id}
                    className="p-4 brand-glow rounded-lg cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/contactos/${c.id}`}
                          className="font-medium hover:underline block"
                        >
                          {c.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs"
                            style={{
                              backgroundColor: `${c.stage_color}20`,
                              color: c.stage_color,
                            }}
                          >
                            {c.stage_name}
                          </span>
                          {c.source && (
                            <span className="text-xs text-muted-foreground">
                              {c.source}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1.5 flex flex-wrap gap-x-3">
                          {c.phone && <span>{c.phone}</span>}
                          {c.email && <span className="truncate">{c.email}</span>}
                          {c.instagram && <span>{c.instagram}</span>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                          <DaysWithoutContactBadge
                            days={days}
                            hasAnyContact={hasNote || !!c.last_contacted_at}
                            isClosed={c.stage_is_won === 1 || c.stage_is_lost === 1}
                          />
                          {!hasNote && !c.last_contacted_at && (
                            <span>Creado {formatDate(c.created_at)}</span>
                          )}
                        </div>
                      </div>
                      <ContactRowActions contact={c} stages={stages} />
                    </div>
                  </ContactMobileItem>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DaysWithoutContactBadge({
  days,
  hasAnyContact,
  isClosed,
}: {
  days: number | null;
  hasAnyContact: boolean;
  isClosed: boolean;
}) {
  if (!hasAnyContact) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        Sin contactar
      </span>
    );
  }
  const d = days ?? 0;
  let tone: "ok" | "soft" | "warn" | "danger" = "ok";
  if (!isClosed) {
    if (d >= 7) tone = "danger";
    else if (d >= 3) tone = "warn";
    else if (d >= 1) tone = "soft";
  }
  const toneClasses = {
    ok: "text-muted-foreground",
    soft: "text-foreground",
    warn: "text-warning font-medium",
    danger: "text-destructive font-semibold",
  }[tone];
  const dotClass = {
    ok: "bg-muted-foreground/40",
    soft: "bg-muted-foreground",
    warn: "bg-warning",
    danger: "bg-destructive",
  }[tone];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs", toneClasses)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dotClass)} />
      {d === 0 ? "Hoy" : `${d} día${d === 1 ? "" : "s"}`}
    </span>
  );
}

function StageFilter({
  stages,
  current,
  query,
}: {
  stages: { id: number; name: string; color: string }[];
  current: number | null;
  query?: string;
}) {
  const qs = (id?: number) => {
    const sp = new URLSearchParams();
    if (query) sp.set("q", query);
    if (id != null) sp.set("stage", String(id));
    return sp.toString();
  };

  return (
    <>
      <Link
        href={`/contactos${qs() ? `?${qs()}` : ""}`}
        className={cn(
          "text-xs px-3 py-1.5 rounded-full border transition-colors",
          current == null
            ? "bg-foreground text-background border-foreground"
            : "border-border hover:bg-accent",
        )}
      >
        Todos
      </Link>
      {stages.map((s) => {
        const active = current === s.id;
        return (
          <Link
            key={s.id}
            href={`/contactos?${qs(s.id)}`}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full border transition-colors inline-flex items-center gap-1.5",
              active
                ? "border-transparent"
                : "border-border hover:bg-accent",
            )}
            style={
              active
                ? { backgroundColor: s.color, color: "white" }
                : undefined
            }
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: active ? "white" : s.color }}
            />
            {s.name}
          </Link>
        );
      })}
    </>
  );
}

function EmptyContacts({
  hasFilter,
  stagesCount,
}: {
  hasFilter: boolean;
  stagesCount: number;
}) {
  return (
    <Card>
      <CardContent className="py-16 text-center space-y-3">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground mx-auto">
          {hasFilter ? (
            <Sparkles className="h-6 w-6" />
          ) : (
            <UsersIcon className="h-6 w-6" />
          )}
        </div>
        <div>
          <h3 className="font-semibold">
            {hasFilter ? "Sin resultados" : "Aún no tienes contactos"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {hasFilter
              ? "Prueba con otra búsqueda o filtro."
              : stagesCount === 0
                ? "Primero crea etapas en tu pipeline."
                : "Agrega tu primer lead para empezar."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
