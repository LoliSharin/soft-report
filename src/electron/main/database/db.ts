import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { app } from 'electron';

import { appConfig } from '../../../shared/app.config';

import { runDataMigrations } from './migrations';
import { createSchema } from './schema';
import { seedDatabase } from './seed';
import {
  openDatabase,
  type DatabaseSync,
  type SQLInputValue,
  type StatementSync,
} from './sqlite-compat';

let database: DatabaseSync | null = null;

export function allRows<T>(statement: StatementSync, ...params: SQLInputValue[]): T[] {
  return statement.all(...params) as unknown as T[];
}

export function getRow<T>(statement: StatementSync, ...params: SQLInputValue[]): T | undefined {
  return statement.get(...params) as T | undefined;
}

export function getDatabasePath(): string {
  return join(app.getPath('userData'), appConfig.database.fileName);
}

export async function initializeDatabase(): Promise<DatabaseSync> {
  if (database) {
    return database;
  }

  const databasePath = getDatabasePath();
  mkdirSync(dirname(databasePath), { recursive: true });

  database = await openDatabase(databasePath);
  createSchema(database);
  seedDatabase(database);
  runDataMigrations(database);

  return database;
}

export function getDb(): DatabaseSync {
  if (!database) {
    throw new Error('Database has not been initialized.');
  }

  return database;
}

export function closeDatabase(): void {
  if (!database) {
    return;
  }

  database.close();
  database = null;
}
