import "server-only";
import { getDb } from "./db";

// Seconds in a day, used for SQLite julianday diffs.
const DAYS = "(julianday('now') - julianday(";

export type StageVelocity = {
  stage_id: number;
  stage_name: string;
  stage_color: string;
  is_won: 0 | 1;
  is_lost: 0 | 1;
  position: number;
  avg_days: number; // avg time a contact spent in this stage before leaving
  sample_size: number;
};

// For each stage, compute the average duration a contact spent there.
// Methodology: for each stage_history row we compute the delta until the next row
// for the same contact, OR until now if it's the contact's latest move.
// We only count stages the contact has LEFT (so avg reflects time-to-leave).
// For the current stage we include time-since-last-move for contacts still there,
// so the metric reflects total residence time so far.
export function getStageVelocity(): StageVelocity[] {
  const db = getDb();
  const rows = db
    .prepare(
      `WITH ordered AS (
         SELECT
           h.id,
           h.contact_id,
           h.to_stage_id,
           h.changed_at,
           LEAD(h.changed_at) OVER (
             PARTITION BY h.contact_id
             ORDER BY h.changed_at, h.id
           ) AS next_changed_at
         FROM stage_history h
       ),
       durations AS (
         SELECT
           to_stage_id AS stage_id,
           (julianday(COALESCE(next_changed_at, datetime('now')))
            - julianday(changed_at)) AS days
         FROM ordered
       )
       SELECT s.id AS stage_id,
              s.name AS stage_name,
              s.color AS stage_color,
              s.is_won,
              s.is_lost,
              s.position,
              COALESCE(AVG(d.days), 0) AS avg_days,
              COUNT(d.days) AS sample_size
         FROM stages s
         LEFT JOIN durations d ON d.stage_id = s.id
        GROUP BY s.id
        ORDER BY s.position ASC, s.id ASC`,
    )
    .all() as StageVelocity[];
  return rows;
}

// Average time from pipeline entry (first stage_history row) to reaching a won stage.
export function getAvgTimeToClose(): { days: number; sample_size: number } {
  const db = getDb();
  const row = db
    .prepare(
      `WITH first_entry AS (
         SELECT contact_id, MIN(changed_at) AS entry_at
           FROM stage_history GROUP BY contact_id
       ),
       first_won AS (
         SELECT h.contact_id, MIN(h.changed_at) AS won_at
           FROM stage_history h
           JOIN stages s ON s.id = h.to_stage_id
          WHERE s.is_won = 1
          GROUP BY h.contact_id
       )
       SELECT COALESCE(AVG(julianday(w.won_at) - julianday(e.entry_at)), 0) AS days,
              COUNT(w.contact_id) AS sample_size
         FROM first_won w
         JOIN first_entry e ON e.contact_id = w.contact_id`,
    )
    .get() as { days: number; sample_size: number };
  return row;
}

export type StuckLead = {
  id: number;
  name: string;
  stage_name: string;
  stage_color: string;
  days_in_stage: number;
  last_stage_change: string;
  stage_id: number;
};

// Contacts currently in a non-closed stage for more than `thresholdDays` days.
// "Current stage entry" = the most recent stage_history row for that contact.
export function getStuckLeads(thresholdDays = 5): StuckLead[] {
  const db = getDb();
  return db
    .prepare(
      `WITH latest_move AS (
         SELECT contact_id, MAX(changed_at) AS changed_at
           FROM stage_history
          GROUP BY contact_id
       )
       SELECT c.id,
              c.name,
              s.id AS stage_id,
              s.name AS stage_name,
              s.color AS stage_color,
              lm.changed_at AS last_stage_change,
              CAST(julianday('now') - julianday(lm.changed_at) AS REAL) AS days_in_stage
         FROM contacts c
         JOIN stages s ON s.id = c.stage_id
         JOIN latest_move lm ON lm.contact_id = c.id
        WHERE s.is_won = 0 AND s.is_lost = 0
          AND (julianday('now') - julianday(lm.changed_at)) > ?
        ORDER BY days_in_stage DESC`,
    )
    .all(thresholdDays) as StuckLead[];
}

export type FunnelStep = {
  stage_id: number;
  stage_name: string;
  stage_color: string;
  position: number;
  count: number;
  conversion_from_entry: number; // 0–1
};

// Count of contacts that have ever reached each stage.
// Conversion = count_stage / count_entry_stage (the first non-lost, non-won stage).
export function getFunnel(): FunnelStep[] {
  const db = getDb();
  const stages = db
    .prepare(
      `SELECT id, name, color, position, is_won, is_lost
         FROM stages
        WHERE is_lost = 0
        ORDER BY position ASC, id ASC`,
    )
    .all() as {
    id: number;
    name: string;
    color: string;
    position: number;
    is_won: 0 | 1;
    is_lost: 0 | 1;
  }[];

  const counts = db.prepare(
    `SELECT COUNT(DISTINCT contact_id) AS n
       FROM stage_history WHERE to_stage_id = ?`,
  );

  const results: FunnelStep[] = stages.map((s) => ({
    stage_id: s.id,
    stage_name: s.name,
    stage_color: s.color,
    position: s.position,
    count: (counts.get(s.id) as { n: number }).n,
    conversion_from_entry: 0,
  }));

  const entry = results[0]?.count ?? 0;
  for (const r of results) {
    r.conversion_from_entry = entry > 0 ? r.count / entry : 0;
  }
  return results;
}

export type LossBreakdown = {
  stage_name: string;
  stage_color: string;
  lost_count: number;
};

// For each non-lost, non-won stage, count how many contacts moved DIRECTLY
// from it into a lost stage. That identifies where leads die.
export function getLossByStage(): LossBreakdown[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT fs.name AS stage_name,
              fs.color AS stage_color,
              COUNT(*) AS lost_count
         FROM stage_history h
         JOIN stages ts ON ts.id = h.to_stage_id
         JOIN stages fs ON fs.id = h.from_stage_id
        WHERE ts.is_lost = 1 AND fs.is_won = 0 AND fs.is_lost = 0
        GROUP BY fs.id
        ORDER BY lost_count DESC`,
    )
    .all() as LossBreakdown[];
}

export function getOverallCloseRate(): {
  rate: number;
  won: number;
  total: number;
} {
  const db = getDb();
  const total = (db.prepare("SELECT COUNT(*) AS n FROM contacts").get() as {
    n: number;
  }).n;
  const won = (db
    .prepare(
      `SELECT COUNT(*) AS n FROM contacts c
         JOIN stages s ON s.id = c.stage_id WHERE s.is_won = 1`,
    )
    .get() as { n: number }).n;
  return {
    rate: total > 0 ? won / total : 0,
    won,
    total,
  };
}

export type WeeklyPoint = { week: string; count: number };

export function getWeeklyNewLeads(weeks = 12): WeeklyPoint[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT strftime('%Y-%W', created_at) AS week,
              COUNT(*) AS count
         FROM contacts
        WHERE created_at >= date('now', ?)
        GROUP BY week
        ORDER BY week ASC`,
    )
    .all(`-${weeks * 7} days`) as WeeklyPoint[];

  // Fill in missing weeks with 0 so the chart shows a continuous line.
  const filled: WeeklyPoint[] = [];
  const now = new Date();
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i * 7);
    const key = weekKey(d);
    const found = rows.find((r) => r.week === key);
    filled.push({ week: key, count: found?.count ?? 0 });
  }
  return filled;
}

function weekKey(d: Date): string {
  // Match SQLite's %Y-%W format (week number, Monday as first day is %W — actually SQLite is Sunday=0)
  const year = d.getUTCFullYear();
  const start = Date.UTC(year, 0, 1);
  const dayOfYear = Math.floor((d.getTime() - start) / 86_400_000);
  const weekNum = String(Math.floor(dayOfYear / 7)).padStart(2, "0");
  return `${year}-${weekNum}`;
}

export type MonthlyRevenue = { month: string; total: number };

export function getMonthlyRevenue(months = 12): MonthlyRevenue[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT strftime('%Y-%m', paid_at) AS month,
              COALESCE(SUM(amount), 0) AS total
         FROM payments
        WHERE paid_at >= date('now', ?)
        GROUP BY month
        ORDER BY month ASC`,
    )
    .all(`-${months} months`) as MonthlyRevenue[];
}

export function getAvgDealSize(): {
  avg: number;
  count: number;
  currency: string;
} {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT COALESCE(AVG(amount), 0) AS avg,
              COUNT(*) AS count,
              COALESCE(MAX(currency), 'USD') AS currency
         FROM payments`,
    )
    .get() as { avg: number; count: number; currency: string };
  return row;
}

export function getProjectedRevenue(): {
  projected: number;
  active_leads: number;
  close_rate: number;
  avg_deal: number;
} {
  const db = getDb();
  const active = (db
    .prepare(
      `SELECT COUNT(*) AS n FROM contacts c
         JOIN stages s ON s.id = c.stage_id
         WHERE s.is_won = 0 AND s.is_lost = 0`,
    )
    .get() as { n: number }).n;
  const { rate } = getOverallCloseRate();
  const { avg } = getAvgDealSize();
  return {
    projected: active * rate * avg,
    active_leads: active,
    close_rate: rate,
    avg_deal: avg,
  };
}

export function getAvgNotesPerWin(): {
  avg: number;
  sample_size: number;
} {
  const db = getDb();
  const row = db
    .prepare(
      `WITH won AS (
         SELECT c.id FROM contacts c
         JOIN stages s ON s.id = c.stage_id WHERE s.is_won = 1
       )
       SELECT COALESCE(AVG(cnt), 0) AS avg, COUNT(*) AS sample_size
         FROM (
           SELECT COUNT(n.id) AS cnt
             FROM won
             LEFT JOIN notes n ON n.contact_id = won.id
            GROUP BY won.id
         )`,
    )
    .get() as { avg: number; sample_size: number };
  return row;
}

export function getAvgFirstResponseTime(): {
  days: number;
  sample_size: number;
} {
  const db = getDb();
  const row = db
    .prepare(
      `WITH first_note AS (
         SELECT contact_id, MIN(created_at) AS first_at
           FROM notes GROUP BY contact_id
       )
       SELECT COALESCE(AVG(julianday(fn.first_at) - julianday(c.created_at)), 0) AS days,
              COUNT(*) AS sample_size
         FROM first_note fn
         JOIN contacts c ON c.id = fn.contact_id`,
    )
    .get() as { days: number; sample_size: number };
  return row;
}

export function getAbandonedRate(): {
  rate: number;
  abandoned: number;
  total: number;
} {
  const db = getDb();
  const total = (db.prepare("SELECT COUNT(*) AS n FROM contacts").get() as {
    n: number;
  }).n;
  const abandoned = (db
    .prepare(
      `SELECT COUNT(*) AS n FROM contacts c
         JOIN stages s ON s.id = c.stage_id
         WHERE s.is_won = 0 AND s.is_lost = 0
           AND NOT EXISTS (SELECT 1 FROM notes n WHERE n.contact_id = c.id)`,
    )
    .get() as { n: number }).n;
  return {
    rate: total > 0 ? abandoned / total : 0,
    abandoned,
    total,
  };
}

// Silence unused-import noise if any code path branches out
void DAYS;
