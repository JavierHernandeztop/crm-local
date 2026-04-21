"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { redirect } from "next/navigation";
import { getDb } from "../db";

const Stage = z.object({
  name: z.string().trim().min(1),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/),
  kind: z.enum(["open", "won", "lost"]),
});

const OnboardInput = z.object({
  business_name: z.string().trim().min(1),
  currency: z.string().trim().min(1).max(5),
  brand_hue: z.coerce.number().int().min(0).max(360),
  stages: z.array(Stage).min(1).max(12),
});

export async function completeOnboarding(raw: unknown) {
  const parsed = OnboardInput.parse(raw);
  const db = getDb();
  db.transaction(() => {
    const setting = db.prepare(
      `INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    );
    setting.run("business_name", parsed.business_name);
    setting.run("currency", parsed.currency);
    setting.run("brand_hue", String(parsed.brand_hue));
    setting.run("onboarded", "true");

    // Wipe default seeded stages and replace with user-provided ones,
    // but only if no contacts exist yet (safety).
    const contactCount = (db
      .prepare("SELECT COUNT(*) AS n FROM contacts")
      .get() as { n: number }).n;
    if (contactCount === 0) {
      db.prepare("DELETE FROM stages").run();
      const insertStage = db.prepare(
        `INSERT INTO stages (name, position, color, is_won, is_lost) VALUES (?, ?, ?, ?, ?)`,
      );
      parsed.stages.forEach((s, i) => {
        insertStage.run(
          s.name,
          i,
          s.color,
          s.kind === "won" ? 1 : 0,
          s.kind === "lost" ? 1 : 0,
        );
      });
    }
  })();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function skipOnboarding() {
  getDb()
    .prepare(
      `INSERT INTO settings (key, value) VALUES ('onboarded', 'true')
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    )
    .run();
  revalidatePath("/", "layout");
  redirect("/");
}
