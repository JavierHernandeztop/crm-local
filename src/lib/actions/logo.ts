"use server";

import { revalidatePath } from "next/cache";
import fs from "node:fs/promises";
import path from "node:path";
import { getDb } from "../db";

const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export async function uploadLogo(formData: FormData) {
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Selecciona un archivo de imagen.");
  }
  if (!ALLOWED.has(file.type)) {
    throw new Error("Formato no soportado. Usa PNG, JPG, WEBP o SVG.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("La imagen es muy grande (máx 2 MB).");
  }

  const ext = file.type === "image/svg+xml"
    ? "svg"
    : file.type.split("/")[1]!.replace("jpeg", "jpg");
  const publicDir = path.resolve(process.cwd(), "public", "uploads");
  await fs.mkdir(publicDir, { recursive: true });

  // Remove previous logo files
  const existing = await fs.readdir(publicDir).catch(() => [] as string[]);
  for (const f of existing) {
    if (f.startsWith("logo.")) {
      await fs.unlink(path.join(publicDir, f)).catch(() => {});
    }
  }

  const filename = `logo.${ext}`;
  const dest = path.join(publicDir, filename);
  const arrayBuffer = await file.arrayBuffer();
  await fs.writeFile(dest, Buffer.from(arrayBuffer));

  const publicPath = `/uploads/${filename}?v=${Date.now()}`;
  const db = getDb();
  db.prepare(
    `INSERT INTO settings (key, value) VALUES ('logo_path', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  ).run(publicPath);

  revalidatePath("/", "layout");
}

export async function removeLogo() {
  const publicDir = path.resolve(process.cwd(), "public", "uploads");
  const existing = await fs.readdir(publicDir).catch(() => [] as string[]);
  for (const f of existing) {
    if (f.startsWith("logo.")) {
      await fs.unlink(path.join(publicDir, f)).catch(() => {});
    }
  }
  getDb().prepare("DELETE FROM settings WHERE key = 'logo_path'").run();
  revalidatePath("/", "layout");
}
