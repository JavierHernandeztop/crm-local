"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "../db";

const NoteInput = z.object({
  contact_id: z.coerce.number().int().positive(),
  body: z.string().trim().min(1),
});

export async function createNote(formData: FormData) {
  const parsed = NoteInput.parse({
    contact_id: formData.get("contact_id"),
    body: formData.get("body"),
  });
  const db = getDb();
  db.transaction(() => {
    db.prepare(
      "INSERT INTO notes (contact_id, body) VALUES (?, ?)",
    ).run(parsed.contact_id, parsed.body);
    db.prepare(
      "UPDATE contacts SET last_contacted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
    ).run(parsed.contact_id);
  })();
  revalidatePath("/", "layout");
}

export async function deleteNote(id: number) {
  const db = getDb();
  db.prepare("DELETE FROM notes WHERE id = ?").run(id);
  revalidatePath("/", "layout");
}
