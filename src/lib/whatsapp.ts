// Shared utilities for WhatsApp links. Kept separate from whatsapp-link.tsx
// (a client component) so it can be imported from server components too.

export function sanitizePhoneForWa(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

export function waLink(phone: string): string | null {
  const digits = sanitizePhoneForWa(phone);
  return digits ? `https://wa.me/${digits}` : null;
}
