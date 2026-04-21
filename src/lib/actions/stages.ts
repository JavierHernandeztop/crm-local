"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "../db";

const StageInput = z.object({
  name: z.string().trim().min(1),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#64748b"),
  is_won: z.coerce.number().int().min(0).max(1).default(0),
  is_lost: z.coerce.number().int().min(0).max(1).default(0),
});

export async function createStage(formData: FormData) {
  const parsed = StageInput.parse({
    name: formData.get("name"),
    color: formData.get("color") || "#64748b",
    is_won: formData.get("is_won") || 0,
    is_lost: formData.get("is_lost") || 0,
  });
  const db = getDb();
  const pos = (db
    .prepare("SELECT COALESCE(MAX(position), -1) + 1 AS p FROM stages")
    .get() as { p: number }).p;
  db.prepare(
    "INSERT INTO stages (name, position, color, is_won, is_lost) VALUES (?, ?, ?, ?, ?)",
  ).run(parsed.name, pos, parsed.color, parsed.is_won, parsed.is_lost);
  revalidatePath("/", "layout");
}

export async function updateStage(id: number, formData: FormData) {
  const parsed = StageInput.parse({
    name: formData.get("name"),
    color: formData.get("color") || "#64748b",
    is_won: formData.get("is_won") || 0,
    is_lost: formData.get("is_lost") || 0,
  });
  const db = getDb();
  db.prepare(
    "UPDATE stages SET name = ?, color = ?, is_won = ?, is_lost = ? WHERE id = ?",
  ).run(parsed.name, parsed.color, parsed.is_won, parsed.is_lost, id);
  revalidatePath("/", "layout");
}

export async function deleteStage(id: number) {
  const db = getDb();
  const count = (db
    .prepare("SELECT COUNT(*) AS n FROM contacts WHERE stage_id = ?")
    .get(id) as { n: number }).n;
  if (count > 0) {
    throw new Error(
      "No puedes eliminar una etapa que tiene contactos. Muévelos primero.",
    );
  }
  db.prepare("DELETE FROM stages WHERE id = ?").run(id);
  revalidatePath("/", "layout");
}

export async function reorderStages(orderedIds: number[]) {
  const db = getDb();
  const upd = db.prepare("UPDATE stages SET position = ? WHERE id = ?");
  db.transaction(() => {
    orderedIds.forEach((id, i) => upd.run(i, id));
  })();
  revalidatePath("/", "layout");
}
