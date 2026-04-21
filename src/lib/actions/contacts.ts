"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "../db";
import { insertNotification } from "../notifications";

const ContactInput = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  phone: z.string().trim().optional().nullable(),
  email: z.string().trim().optional().nullable(),
  instagram: z.string().trim().optional().nullable(),
  source: z.string().trim().optional().nullable(),
  stage_id: z.coerce.number().int().positive().optional(),
});

function nullable(v: FormDataEntryValue | null): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length === 0 ? null : s;
}

export async function createContact(formData: FormData) {
  const parsed = ContactInput.parse({
    name: formData.get("name"),
    phone: nullable(formData.get("phone")),
    email: nullable(formData.get("email")),
    instagram: nullable(formData.get("instagram")),
    source: nullable(formData.get("source")),
    stage_id: formData.get("stage_id") || undefined,
  });
  const db = getDb();
  const stageId =
    parsed.stage_id ??
    (db
      .prepare("SELECT id FROM stages ORDER BY position ASC, id ASC LIMIT 1")
      .get() as { id: number }).id;
  const pos = (db
    .prepare(
      "SELECT COALESCE(MAX(position), -1) + 1 AS p FROM contacts WHERE stage_id = ?",
    )
    .get(stageId) as { p: number }).p;
  const result = db
    .prepare(
      `INSERT INTO contacts (name, phone, email, instagram, source, stage_id, position)
       VALUES (@name, @phone, @email, @instagram, @source, @stage_id, @position)`,
    )
    .run({
      name: parsed.name,
      phone: parsed.phone ?? null,
      email: parsed.email ?? null,
      instagram: parsed.instagram ?? null,
      source: parsed.source ?? null,
      stage_id: stageId,
      position: pos,
    });
  const newId = Number(result.lastInsertRowid);
  db.prepare(
    `INSERT INTO stage_history (contact_id, from_stage_id, to_stage_id)
       VALUES (?, NULL, ?)`,
  ).run(newId, stageId);
  insertNotification({
    kind: "new_contact",
    severity: "success",
    contact_id: newId,
    dedupe_key: `new_contact:${newId}`,
    title: `Nuevo lead: ${parsed.name}`,
    body: parsed.source ? `Fuente: ${parsed.source}` : null,
  });
  revalidatePath("/", "layout");
  return { id: newId };
}

export async function updateContact(id: number, formData: FormData) {
  const parsed = ContactInput.parse({
    name: formData.get("name"),
    phone: nullable(formData.get("phone")),
    email: nullable(formData.get("email")),
    instagram: nullable(formData.get("instagram")),
    source: nullable(formData.get("source")),
    stage_id: formData.get("stage_id") || undefined,
  });
  const db = getDb();
  db.transaction(() => {
    const prev = db
      .prepare("SELECT stage_id FROM contacts WHERE id = ?")
      .get(id) as { stage_id: number } | undefined;
    db.prepare(
      `UPDATE contacts
         SET name = @name,
             phone = @phone,
             email = @email,
             instagram = @instagram,
             source = @source,
             stage_id = COALESCE(@stage_id, stage_id),
             updated_at = datetime('now')
       WHERE id = @id`,
    ).run({
      id,
      name: parsed.name,
      phone: parsed.phone ?? null,
      email: parsed.email ?? null,
      instagram: parsed.instagram ?? null,
      source: parsed.source ?? null,
      stage_id: parsed.stage_id ?? null,
    });
    if (prev && parsed.stage_id && parsed.stage_id !== prev.stage_id) {
      db.prepare(
        `INSERT INTO stage_history (contact_id, from_stage_id, to_stage_id)
           VALUES (?, ?, ?)`,
      ).run(id, prev.stage_id, parsed.stage_id);
    }
  })();
  revalidatePath("/", "layout");
}

export async function deleteContact(id: number) {
  const db = getDb();
  db.prepare("DELETE FROM contacts WHERE id = ?").run(id);
  revalidatePath("/", "layout");
}

export async function markContacted(id: number) {
  const db = getDb();
  db.prepare(
    "UPDATE contacts SET last_contacted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
  ).run(id);
  revalidatePath("/", "layout");
}

export async function moveContactToStage(
  contactId: number,
  toStageId: number,
  newPosition: number,
) {
  const db = getDb();
  db.transaction(() => {
    const current = db
      .prepare("SELECT stage_id, position FROM contacts WHERE id = ?")
      .get(contactId) as { stage_id: number; position: number } | undefined;
    if (!current) return;

    if (current.stage_id === toStageId) {
      if (newPosition > current.position) {
        db.prepare(
          `UPDATE contacts SET position = position - 1
             WHERE stage_id = ? AND position > ? AND position <= ? AND id != ?`,
        ).run(toStageId, current.position, newPosition, contactId);
      } else if (newPosition < current.position) {
        db.prepare(
          `UPDATE contacts SET position = position + 1
             WHERE stage_id = ? AND position >= ? AND position < ? AND id != ?`,
        ).run(toStageId, newPosition, current.position, contactId);
      }
      db.prepare(
        "UPDATE contacts SET position = ?, updated_at = datetime('now') WHERE id = ?",
      ).run(newPosition, contactId);
    } else {
      db.prepare(
        "UPDATE contacts SET position = position - 1 WHERE stage_id = ? AND position > ?",
      ).run(current.stage_id, current.position);
      db.prepare(
        "UPDATE contacts SET position = position + 1 WHERE stage_id = ? AND position >= ?",
      ).run(toStageId, newPosition);
      db.prepare(
        "UPDATE contacts SET stage_id = ?, position = ?, updated_at = datetime('now') WHERE id = ?",
      ).run(toStageId, newPosition, contactId);
      db.prepare(
        "INSERT INTO stage_history (contact_id, from_stage_id, to_stage_id) VALUES (?, ?, ?)",
      ).run(contactId, current.stage_id, toStageId);
    }
  })();
  revalidatePath("/", "layout");
}
