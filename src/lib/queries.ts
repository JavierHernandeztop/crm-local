import "server-only";
import { getDb } from "./db";
import type {
  Contact,
  ContactWithStage,
  Note,
  Payment,
  Settings,
  Stage,
} from "./types";

export function getSettings(): Settings {
  const db = getDb();
  const rows = db
    .prepare("SELECT key, value FROM settings")
    .all() as { key: string; value: string }[];
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    business_name: map.business_name ?? "Mi Negocio",
    brand_hue: map.brand_hue ?? "221",
    currency: map.currency ?? "USD",
    logo_path: map.logo_path ?? null,
    onboarded: map.onboarded === "true",
  };
}

export function listStages(): Stage[] {
  return getDb()
    .prepare("SELECT * FROM stages ORDER BY position ASC, id ASC")
    .all() as Stage[];
}

export function listContacts(
  options: { search?: string; stageId?: number | null } = {},
): (ContactWithStage & { last_note_at: string | null })[] {
  const db = getDb();
  const where: string[] = [];
  const params: Record<string, unknown> = {};
  if (options.search) {
    where.push(
      "(c.name LIKE @q OR c.phone LIKE @q OR c.email LIKE @q OR c.instagram LIKE @q OR c.source LIKE @q)",
    );
    params.q = `%${options.search}%`;
  }
  if (options.stageId != null) {
    where.push("c.stage_id = @stageId");
    params.stageId = options.stageId;
  }
  const sql = `
    SELECT c.*,
           s.name AS stage_name,
           s.color AS stage_color,
           s.is_won AS stage_is_won,
           s.is_lost AS stage_is_lost,
           (SELECT MAX(created_at) FROM notes n WHERE n.contact_id = c.id) AS last_note_at
    FROM contacts c
    JOIN stages s ON s.id = c.stage_id
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY c.updated_at DESC
  `;
  return db.prepare(sql).all(params) as (ContactWithStage & {
    last_note_at: string | null;
  })[];
}

export function listContactsByStage(): Map<number, ContactWithStage[]> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT c.*, s.name AS stage_name, s.color AS stage_color,
              s.is_won AS stage_is_won, s.is_lost AS stage_is_lost
         FROM contacts c
         JOIN stages s ON s.id = c.stage_id
         ORDER BY c.position ASC, c.id ASC`,
    )
    .all() as ContactWithStage[];
  const map = new Map<number, ContactWithStage[]>();
  for (const row of rows) {
    const list = map.get(row.stage_id);
    if (list) list.push(row);
    else map.set(row.stage_id, [row]);
  }
  return map;
}

export function getContact(id: number): ContactWithStage | null {
  const row = getDb()
    .prepare(
      `SELECT c.*, s.name AS stage_name, s.color AS stage_color,
              s.is_won AS stage_is_won, s.is_lost AS stage_is_lost
         FROM contacts c JOIN stages s ON s.id = c.stage_id
         WHERE c.id = ?`,
    )
    .get(id) as ContactWithStage | undefined;
  return row ?? null;
}

export function listNotes(contactId: number): Note[] {
  return getDb()
    .prepare(
      "SELECT * FROM notes WHERE contact_id = ? ORDER BY created_at DESC, id DESC",
    )
    .all(contactId) as Note[];
}

export function getPayment(contactId: number): Payment | null {
  const row = getDb()
    .prepare("SELECT * FROM payments WHERE contact_id = ?")
    .get(contactId) as Payment | undefined;
  return row ?? null;
}

export function listClosedClients(): (ContactWithStage & {
  payment: Payment | null;
})[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT c.*, s.name AS stage_name, s.color AS stage_color,
              s.is_won AS stage_is_won, s.is_lost AS stage_is_lost
         FROM contacts c
         JOIN stages s ON s.id = c.stage_id
         WHERE s.is_won = 1
         ORDER BY c.updated_at DESC`,
    )
    .all() as ContactWithStage[];
  const payStmt = db.prepare(
    "SELECT * FROM payments WHERE contact_id = ?",
  );
  return rows.map((c) => ({
    ...c,
    payment: (payStmt.get(c.id) as Payment | undefined) ?? null,
  }));
}

export type DashboardMetrics = {
  totalSold: number;
  activeClients: number;
  closeRate: number;
  totalLeads: number;
  leadsBySource: { source: string; count: number }[];
  salesByMonth: { month: string; total: number }[];
  pipelineValue: number;
};

export function getDashboardMetrics(): DashboardMetrics {
  const db = getDb();

  const totalSold = (db
    .prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM payments")
    .get() as { total: number }).total;

  const activeClients = (db
    .prepare(
      `SELECT COUNT(*) AS n
         FROM contacts c JOIN stages s ON s.id = c.stage_id
         WHERE s.is_won = 0 AND s.is_lost = 0`,
    )
    .get() as { n: number }).n;

  const totalLeads = (db
    .prepare("SELECT COUNT(*) AS n FROM contacts")
    .get() as { n: number }).n;

  const won = (db
    .prepare(
      `SELECT COUNT(*) AS n
         FROM contacts c JOIN stages s ON s.id = c.stage_id
         WHERE s.is_won = 1`,
    )
    .get() as { n: number }).n;

  const closed = (db
    .prepare(
      `SELECT COUNT(*) AS n
         FROM contacts c JOIN stages s ON s.id = c.stage_id
         WHERE s.is_won = 1 OR s.is_lost = 1`,
    )
    .get() as { n: number }).n;

  const closeRate = closed > 0 ? won / closed : 0;

  const leadsBySource = db
    .prepare(
      `SELECT COALESCE(NULLIF(TRIM(source), ''), 'Sin fuente') AS source,
              COUNT(*) AS count
         FROM contacts
         GROUP BY COALESCE(NULLIF(TRIM(source), ''), 'Sin fuente')
         ORDER BY count DESC
         LIMIT 10`,
    )
    .all() as { source: string; count: number }[];

  const salesByMonth = db
    .prepare(
      `SELECT strftime('%Y-%m', paid_at) AS month,
              COALESCE(SUM(amount), 0) AS total
         FROM payments
         GROUP BY month
         ORDER BY month ASC
         LIMIT 12`,
    )
    .all() as { month: string; total: number }[];

  const pipelineValue = 0;

  return {
    totalSold,
    activeClients,
    closeRate,
    totalLeads,
    leadsBySource,
    salesByMonth,
    pipelineValue,
  };
}

export type StaleBucket = "day1" | "day3" | "day7";

export function listStaleContacts(): {
  day1: ContactWithStage[];
  day3: ContactWithStage[];
  day7: ContactWithStage[];
  total: number;
} {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT c.*, s.name AS stage_name, s.color AS stage_color,
              s.is_won AS stage_is_won, s.is_lost AS stage_is_lost
         FROM contacts c JOIN stages s ON s.id = c.stage_id
         WHERE s.is_won = 0 AND s.is_lost = 0
         ORDER BY COALESCE(c.last_contacted_at, c.created_at) ASC`,
    )
    .all() as ContactWithStage[];
  const now = Date.now();
  const buckets: {
    day1: ContactWithStage[];
    day3: ContactWithStage[];
    day7: ContactWithStage[];
  } = { day1: [], day3: [], day7: [] };
  for (const c of rows) {
    const ref = c.last_contacted_at ?? c.created_at;
    if (!ref) continue;
    const refDate = new Date(ref.replace(" ", "T") + "Z");
    if (Number.isNaN(refDate.getTime())) continue;
    const days = Math.floor((now - refDate.getTime()) / 86_400_000);
    if (days >= 7) buckets.day7.push(c);
    else if (days >= 3) buckets.day3.push(c);
    else if (days >= 1) buckets.day1.push(c);
  }
  return {
    ...buckets,
    total: buckets.day1.length + buckets.day3.length + buckets.day7.length,
  };
}

export function getContactById(id: number): Contact | null {
  const row = getDb()
    .prepare("SELECT * FROM contacts WHERE id = ?")
    .get(id) as Contact | undefined;
  return row ?? null;
}
