import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  AtSign,
  Mail,
  Phone,
  User,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getContact,
  getPayment,
  getSettings,
  listNotes,
  listStages,
} from "@/lib/queries";
import { sanitizePhoneForWa } from "@/lib/whatsapp";
import { ContactFormDialog } from "@/components/contact-form-dialog";
import { ContactRowActions } from "@/components/contact-row-actions";
import { MarkContactedButton } from "@/components/mark-contacted-button";
import { NotesSection } from "@/components/notes-section";
import { PaymentSection } from "@/components/payment-section";
import { formatDate, formatDateTime, daysSince } from "@/lib/utils";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contactId = Number(id);
  if (Number.isNaN(contactId)) notFound();

  const contact = getContact(contactId);
  if (!contact) notFound();

  const stages = listStages();
  const notes = listNotes(contactId);
  const payment = getPayment(contactId);
  const settings = getSettings();
  const daysWithoutContact = daysSince(
    contact.last_contacted_at ?? contact.created_at,
  );

  return (
    <div className="space-y-6 animate-in-fade">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/contactos">
            <ArrowLeft className="h-4 w-4" /> Contactos
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-start gap-4 justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-14 w-14 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-semibold">
            {contact.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight truncate">
              {contact.name}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: `${contact.stage_color}20`,
                  color: contact.stage_color,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: contact.stage_color }}
                />
                {contact.stage_name}
              </span>
              {contact.source && (
                <span className="text-xs text-muted-foreground">
                  · {contact.source}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {contact.phone && sanitizePhoneForWa(contact.phone) && (
            <a
              href={`https://wa.me/${sanitizePhoneForWa(contact.phone)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:scale-[1.03] active:scale-[0.98]"
              style={{ backgroundColor: "#25D366" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 32 32"
                width="16"
                height="16"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.48-1.332.128-.302.128-.57.086-.887-.13-.99-1.432-1.633-2.378-1.79-.14-.028-.28-.028-.416-.014Z" />
                <path d="M16.005 2.66C8.634 2.66 2.66 8.635 2.66 16.005c0 2.38.636 4.693 1.838 6.73L2.66 29.34l6.763-1.77a13.28 13.28 0 0 0 6.582 1.77c7.37 0 13.345-5.974 13.345-13.345S23.375 2.66 16.005 2.66Zm0 24.05a10.67 10.67 0 0 1-5.43-1.484l-.39-.232-4.017 1.052 1.073-3.91-.253-.404a10.66 10.66 0 0 1-1.627-5.677c0-5.89 4.79-10.68 10.68-10.68 5.89 0 10.68 4.79 10.68 10.68 0 5.89-4.79 10.67-10.68 10.67Z" />
              </svg>
              WhatsApp
            </a>
          )}
          <MarkContactedButton contactId={contact.id} />
          <ContactFormDialog
            stages={stages}
            contact={contact}
            trigger={<Button variant="outline">Editar</Button>}
          />
          <ContactRowActions contact={contact} stages={stages} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Información
            </h2>
            <InfoRow
              icon={<Phone className="h-4 w-4" />}
              label="Teléfono"
              value={contact.phone}
              href={contact.phone ? `tel:${contact.phone}` : undefined}
            />
            <InfoRow
              icon={<Mail className="h-4 w-4" />}
              label="Email"
              value={contact.email}
              href={contact.email ? `mailto:${contact.email}` : undefined}
            />
            <InfoRow
              icon={<AtSign className="h-4 w-4" />}
              label="Instagram"
              value={contact.instagram}
              href={
                contact.instagram
                  ? `https://instagram.com/${contact.instagram.replace(/^@/, "")}`
                  : undefined
              }
            />
            <InfoRow
              icon={<User className="h-4 w-4" />}
              label="Fuente"
              value={contact.source}
            />
            <div className="border-t border-border pt-4 space-y-2 text-xs text-muted-foreground">
              <div>
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Último contacto:{" "}
                </span>
                {contact.last_contacted_at
                  ? `${formatDate(contact.last_contacted_at)} (hace ${daysWithoutContact ?? 0}d)`
                  : "Nunca"}
              </div>
              <div>Creado: {formatDate(contact.created_at)}</div>
              <div>Actualizado: {formatDateTime(contact.updated_at)}</div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {contact.stage_is_won === 1 && (
            <PaymentSection
              contact={contact}
              payment={payment}
              stages={stages}
              defaultCurrency={settings.currency}
            />
          )}
          <NotesSection contactId={contact.id} notes={notes} />
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        {value ? (
          href ? (
            <a
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="text-sm truncate block hover:underline"
            >
              {value}
            </a>
          ) : (
            <div className="text-sm truncate">{value}</div>
          )
        ) : (
          <div className="text-sm text-muted-foreground">—</div>
        )}
      </div>
    </div>
  );
}
