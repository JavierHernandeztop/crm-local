"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "../db";

export async function markNotificationRead(id: number) {
  getDb()
    .prepare(
      "UPDATE notifications SET read_at = datetime('now') WHERE id = ? AND read_at IS NULL",
    )
    .run(id);
  revalidatePath("/", "layout");
}

export async function markAllNotificationsRead() {
  getDb()
    .prepare(
      "UPDATE notifications SET read_at = datetime('now') WHERE read_at IS NULL",
    )
    .run();
  revalidatePath("/", "layout");
}
