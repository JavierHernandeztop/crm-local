import "server-only";
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

declare global {
  // eslint-disable-next-line no-var
  var __crmDb: Database.Database | undefined;
}

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "crm.db");

function openDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  seed(db);
  return db;
}

const MIGRATIONS: { id: number; sql: string }[] = [
  {
    id: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS stages (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT NOT NULL,
        position   INTEGER NOT NULL,
        color      TEXT NOT NULL DEFAULT '#64748b',
        is_won     INTEGER NOT NULL DEFAULT 0,
        is_lost    INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS contacts (
        id                 INTEGER PRIMARY KEY AUTOINCREMENT,
        name               TEXT NOT NULL,
        phone              TEXT,
        email              TEXT,
        instagram          TEXT,
        source             TEXT,
        stage_id           INTEGER NOT NULL REFERENCES stages(id) ON DELETE RESTRICT,
        position           INTEGER NOT NULL DEFAULT 0,
        last_contacted_at  TEXT,
        created_at         TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_contacts_stage ON contacts(stage_id);
      CREATE INDEX IF NOT EXISTS idx_contacts_source ON contacts(source);

      CREATE TABLE IF NOT EXISTS notes (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        body       TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_notes_contact ON notes(contact_id);

      CREATE TABLE IF NOT EXISTS payments (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        contact_id INTEGER NOT NULL UNIQUE REFERENCES contacts(id) ON DELETE CASCADE,
        amount     REAL NOT NULL,
        currency   TEXT NOT NULL DEFAULT 'USD',
        method     TEXT NOT NULL,
        paid_at    TEXT NOT NULL,
        notes      TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
  },
  {
    id: 2,
    sql: `ALTER TABLE payments ADD COLUMN service TEXT;`,
  },
  {
    id: 3,
    sql: `
      CREATE TABLE IF NOT EXISTS notifications (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        kind        TEXT NOT NULL,
        severity    TEXT NOT NULL,
        contact_id  INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
        dedupe_key  TEXT NOT NULL UNIQUE,
        title       TEXT NOT NULL,
        body        TEXT,
        read_at     TEXT,
        created_at  TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_notif_unread
        ON notifications(read_at, created_at DESC);
    `,
  },
  {
    id: 4,
    sql: `
      CREATE TABLE IF NOT EXISTS stage_history (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        contact_id    INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        from_stage_id INTEGER REFERENCES stages(id) ON DELETE SET NULL,
        to_stage_id   INTEGER NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
        changed_at    TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_stage_history_contact
        ON stage_history(contact_id, changed_at);
      CREATE INDEX IF NOT EXISTS idx_stage_history_to
        ON stage_history(to_stage_id);

      -- Backfill: every existing contact gets an entry row with its current stage
      -- at its creation timestamp. Without this, analytics would be empty for
      -- pre-existing data.
      INSERT INTO stage_history (contact_id, from_stage_id, to_stage_id, changed_at)
      SELECT id, NULL, stage_id, created_at FROM contacts
      WHERE NOT EXISTS (
        SELECT 1 FROM stage_history h WHERE h.contact_id = contacts.id
      );
    `,
  },
];

function migrate(db: Database.Database) {
  db.exec(`CREATE TABLE IF NOT EXISTS _migrations (
    id INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  );`);
  const applied = new Set(
    (db.prepare("SELECT id FROM _migrations").all() as { id: number }[]).map(
      (r) => r.id,
    ),
  );
  const insert = db.prepare("INSERT INTO _migrations (id) VALUES (?)");
  for (const m of MIGRATIONS) {
    if (applied.has(m.id)) continue;
    db.transaction(() => {
      db.exec(m.sql);
      insert.run(m.id);
    })();
  }
}

function seed(db: Database.Database) {
  const stageCount = db
    .prepare("SELECT COUNT(*) AS n FROM stages")
    .get() as { n: number };
  if (stageCount.n === 0) {
    const ins = db.prepare(
      "INSERT INTO stages (name, position, color, is_won, is_lost) VALUES (?, ?, ?, ?, ?)",
    );
    db.transaction(() => {
      ins.run("Nuevo lead", 0, "#3b82f6", 0, 0);
      ins.run("En conversación", 1, "#f59e0b", 0, 0);
      ins.run("Propuesta enviada", 2, "#8b5cf6", 0, 0);
      ins.run("Cerrado ganado", 3, "#10b981", 1, 0);
      ins.run("Perdido", 4, "#ef4444", 0, 1);
    })();
  }

  const settingCount = db
    .prepare("SELECT COUNT(*) AS n FROM settings")
    .get() as { n: number };
  if (settingCount.n === 0) {
    const ins = db.prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?)",
    );
    db.transaction(() => {
      ins.run("business_name", "Mi Negocio");
      ins.run("brand_hue", "221");
      ins.run("currency", "USD");
    })();
  }
}

export function getDb(): Database.Database {
  if (!global.__crmDb) global.__crmDb = openDb();
  return global.__crmDb;
}
