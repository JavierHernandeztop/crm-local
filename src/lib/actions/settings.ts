"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "../db";

const SettingsInput = z.object({
  business_name: z.string().trim().min(1),
  brand_hue: z.string().regex(/^\d{1,3}$/),
  currency: z.string().trim().min(1),
});

export async function updateSettings(formData: FormData) {
  const parsed = SettingsInput.parse({
    business_name: formData.get("business_name"),
    brand_hue: formData.get("brand_hue"),
    currency: formData.get("currency"),
  });
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  );
  db.transaction(() => {
    stmt.run("business_name", parsed.business_name);
    stmt.run("brand_hue", parsed.brand_hue);
    stmt.run("currency", parsed.currency);
  })();
  revalidatePath("/", "layout");
}
