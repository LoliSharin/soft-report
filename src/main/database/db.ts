import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { app } from 'electron';

import { appConfig } from '../../shared/app.config';

let database: DatabaseSync | null = null;

function getDatabasePath(): string {
  return join(app.getPath('userData'), appConfig.database.fileName);
}

function initializeDatabase(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
}

export function getDb(): DatabaseSync {
  if (database) {
    return database;
  }

  const databasePath = getDatabasePath();
  mkdirSync(dirname(databasePath), { recursive: true });

  database = new DatabaseSync(databasePath);
  initializeDatabase(database);

  return database;
}
