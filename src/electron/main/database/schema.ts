import type { DatabaseSync } from './sqlite-compat';

interface TableInfoRow {
  name: string;
}

function hasColumn(
  db: DatabaseSync,
  tableName: string,
  columnName: string,
): boolean {
  const rows = db
    .prepare(`PRAGMA table_info(${tableName})`)
    .all() as unknown as TableInfoRow[];

  return rows.some((row) => row.name === columnName);
}

function ensureColumnExists(
  db: DatabaseSync,
  tableName: string,
  columnName: string,
  columnDefinition: string,
): void {
  if (hasColumn(db, tableName, columnName)) {
    return;
  }

  db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`);
}

export function createSchema(db: DatabaseSync): void {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dictionaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK (type IN ('event_level', 'participation_result')),
      code TEXT NOT NULL,
      label TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
      created_at TEXT NOT NULL,
      UNIQUE (type, code)
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level_id INTEGER NOT NULL REFERENCES dictionaries(id) ON DELETE RESTRICT,
      event_date TEXT NOT NULL,
      location TEXT NOT NULL,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      participant_type TEXT NOT NULL CHECK (participant_type IN ('teacher', 'student')),
      group_name TEXT,
      position_or_subject TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS participations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
      supervisor_id INTEGER REFERENCES participants(id) ON DELETE SET NULL,
      result_id INTEGER NOT NULL REFERENCES dictionaries(id) ON DELETE RESTRICT,
      notes TEXT,
      certificate_image_name TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_events_level_id ON events(level_id);
    CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
    CREATE INDEX IF NOT EXISTS idx_participants_type ON participants(participant_type);
    CREATE INDEX IF NOT EXISTS idx_participations_event_id ON participations(event_id);
    CREATE INDEX IF NOT EXISTS idx_participations_participant_id ON participations(participant_id);
  `);

  ensureColumnExists(
    db,
    'participations',
    'certificate_image_name',
    'certificate_image_name TEXT',
  );
}
