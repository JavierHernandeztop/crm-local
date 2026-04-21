import "server-only";
import { getDb } from "./db";

export type NotifKind =
  | "new_contact"
  | "stale_1"
  | "stale_3"
  | "stale_7";
export type NotifSeverity = "info" | "success" | "warning" | "danger";

export type Notification = {
  id: number;
  kind: NotifKind;
  severity: NotifSeverity;
  contact_id: number | null;
  dedupe_key: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};

export function insertNotification(n: {
  kind: NotifKind;
  severity: NotifSeverity;
  contact_id?: number | null;
  dedupe_key: string;
  title: string;
  body?: string | null;
}): void {
  getDb()
    .prepare(
      `INSERT OR IGNORE INTO notifications (kind, severity, contact_id, dedupe_key, title, body)
         VALUES (@kind, @severity, @contact_id, @dedupe_key, @title, @body)`,
    )
    .run({
      kind: n.kind,
      severity: n.severity,
      contact_id: n.contact_id ?? null,
      dedupe_key: n.dedupe_key,
      title: n.title,
      body: n.body ?? null,
    });
}

// Returns today's UTC date string for dedupe keys that should fire at most once per day
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// Walks active (not-won, not-lost) contacts and generates stale notifications
// (1, 3, 7 days) based on the most recent of last_note_at / last_contacted_at / created_at.
// Dedupes on (kind, contact_id, day) so we create at most one per day per bucket.
export function generateStaleNotifications(): void {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT c.id, c.name,
              (SELECT MAX(created_at) FROM notes n WHERE n.contact_id = c.id) AS last_note_at,
              c.last_contacted_at,
              c.created_at
         FROM contacts c
         JOIN stages s ON s.id = c.stage_id
         WHERE s.is_won = 0 AND s.is_lost = 0`,
    )
    .all() as {
    id: number;
    name: string;
    last_note_at: string | null;
    last_contacted_at: string | null;
    created_at: string;
  }[];

  const now = Date.now();
  const day = today();

  for (const r of rows) {
    const ref = r.last_note_at ?? r.last_contacted_at ?? r.created_at;
    if (!ref) continue;
    const refDate = new Date(ref.replace(" ", "T") + "Z");
    if (Number.isNaN(refDate.getTime())) continue;
    const days = Math.floor((now - refDate.getTime()) / 86_400_000);

    if (days >= 7) {
      insertNotification({
        kind: "stale_7",
        severity: "danger",
        contact_id: r.id,
        dedupe_key: `stale_7:${r.id}:${day}`,
        title: `${r.name} lleva ${days} días sin contacto`,
        body: "¿Lo marcas como perdido o lo retomas?",
      });
    } else if (days >= 3) {
      insertNotification({
        kind: "stale_3",
        severity: "warning",
        contact_id: r.id,
        dedupe_key: `stale_3:${r.id}:${day}`,
        title: `${r.name} lleva ${days} días sin seguimiento`,
        body: null,
      });
    } else if (days >= 1) {
      insertNotification({
        kind: "stale_1",
        severity: "info",
        contact_id: r.id,
        dedupe_key: `stale_1:${r.id}:${day}`,
        title: `${r.name} lleva ${days} día${days === 1 ? "" : "s"} sin seguimiento`,
        body: null,
      });
    }
  }
}

export function listNotifications(limit = 50): Notification[] {
  return getDb()
    .prepare(
      `SELECT * FROM notifications
         ORDER BY read_at IS NOT NULL, created_at DESC, id DESC
         LIMIT ?`,
    )
    .all(limit) as Notification[];
}

export function countUnread(): number {
  return (
    getDb()
      .prepare("SELECT COUNT(*) AS n FROM notifications WHERE read_at IS NULL")
      .get() as { n: number }
  ).n;
}
