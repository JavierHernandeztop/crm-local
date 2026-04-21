"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "../db";

const PaymentInput = z.object({
  contact_id: z.coerce.number().int().positive(),
  amount: z.coerce.number().nonnegative(),
  currency: z.string().trim().default("USD"),
  method: z.string().trim().min(1),
  paid_at: z.string().trim().min(1),
  notes: z.string().trim().optional().nullable(),
  service: z.string().trim().optional().nullable(),
  stage_id: z.coerce.number().int().positive().optional(),
});

export async function upsertPayment(formData: FormData) {
  const parsed = PaymentInput.parse({
    contact_id: formData.get("contact_id"),
    amount: formData.get("amount"),
    currency: formData.get("currency") || "USD",
    method: formData.get("method"),
    paid_at: formData.get("paid_at"),
    notes: formData.get("notes"),
    service: formData.get("service"),
    stage_id: formData.get("stage_id") || undefined,
  });
  const db = getDb();
  db.transaction(() => {
    db.prepare(
      `INSERT INTO payments (contact_id, amount, currency, method, paid_at, notes, service)
         VALUES (@contact_id, @amount, @currency, @method, @paid_at, @notes, @service)
         ON CONFLICT(contact_id) DO UPDATE SET
           amount = excluded.amount,
           currency = excluded.currency,
           method = excluded.method,
           paid_at = excluded.paid_at,
           notes = excluded.notes,
           service = excluded.service`,
    ).run({
      contact_id: parsed.contact_id,
      amount: parsed.amount,
      currency: parsed.currency,
      method: parsed.method,
      paid_at: parsed.paid_at,
      notes: parsed.notes ?? null,
      service: parsed.service ?? null,
    });
    if (parsed.stage_id) {
      db.prepare(
        "UPDATE contacts SET stage_id = ?, updated_at = datetime('now') WHERE id = ?",
      ).run(parsed.stage_id, parsed.contact_id);
    } else {
      db.prepare(
        "UPDATE contacts SET updated_at = datetime('now') WHERE id = ?",
      ).run(parsed.contact_id);
    }
  })();
  revalidatePath("/", "layout");
}

export async function deletePayment(contactId: number) {
  const db = getDb();
  db.prepare("DELETE FROM payments WHERE contact_id = ?").run(contactId);
  revalidatePath("/", "layout");
}
