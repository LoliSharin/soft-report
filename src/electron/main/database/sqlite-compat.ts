import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import initSqlJs, {
  type BindParams,
  type Database as SqlJsDatabase,
  type SqlJsStatic,
  type Statement as SqlJsStatement,
} from 'sql.js';

export type SQLInputValue = number | string | Uint8Array | null;

export interface StatementSync {
  run: (
    ...params: SQLInputValue[]
  ) => {
    lastInsertRowid: number;
    changes: number;
  };
  get: <T = Record<string, unknown>>(...params: SQLInputValue[]) => T | undefined;
  all: <T = Record<string, unknown>>(...params: SQLInputValue[]) => T[];
}

export interface DatabaseSync {
  exec: (sql: string) => void;
  prepare: (sql: string) => StatementSync;
  close: () => void;
}

let sqlModulePromise: Promise<SqlJsStatic> | null = null;

function getSqlModule(): Promise<SqlJsStatic> {
  if (!sqlModulePromise) {
    sqlModulePromise = initSqlJs({
      locateFile: (fileName: string) =>
        require.resolve(`sql.js/dist/${fileName}`),
    });
  }

  return sqlModulePromise!;
}

function bindStatement(
  statement: SqlJsStatement,
  params: SQLInputValue[],
): void {
  if (params.length > 0) {
    statement.bind(params as BindParams);
  }
}

function getLeadingKeyword(sql: string): string {
  const normalized = sql.trim().replace(/^;+/, '');
  const match = normalized.match(/^([A-Za-z]+)/);

  return match ? match[1].toUpperCase() : '';
}

class LegacyStatement implements StatementSync {
  constructor(
    private readonly database: LegacyDatabase,
    private readonly sql: string,
  ) {}

  run(...params: SQLInputValue[]): { lastInsertRowid: number; changes: number } {
    return this.database.run(this.sql, params);
  }

  get<T = Record<string, unknown>>(...params: SQLInputValue[]): T | undefined {
    return this.database.get<T>(this.sql, params);
  }

  all<T = Record<string, unknown>>(...params: SQLInputValue[]): T[] {
    return this.database.all<T>(this.sql, params);
  }
}

class LegacyDatabase implements DatabaseSync {
  private inTransaction = false;
  private closed = false;

  constructor(
    private readonly filePath: string,
    private readonly database: SqlJsDatabase,
  ) {}

  exec(sql: string): void {
    this.assertOpen();
    this.database.exec(sql);

    const keyword = getLeadingKeyword(sql);

    if (keyword === 'BEGIN') {
      this.inTransaction = true;
      return;
    }

    if (keyword === 'COMMIT') {
      this.inTransaction = false;
      this.persist();
      return;
    }

    if (keyword === 'ROLLBACK') {
      this.inTransaction = false;
      return;
    }

    if (!this.inTransaction) {
      this.persist();
    }
  }

  prepare(sql: string): StatementSync {
    this.assertOpen();
    return new LegacyStatement(this, sql);
  }

  close(): void {
    if (this.closed) {
      return;
    }

    this.persist();
    this.database.close();
    this.closed = true;
  }

  run(
    sql: string,
    params: SQLInputValue[],
  ): { lastInsertRowid: number; changes: number } {
    this.assertOpen();
    this.database.run(sql, params as BindParams);

    const meta =
      this.get<{ lastInsertRowid: number; changes: number }>(
        'SELECT last_insert_rowid() AS lastInsertRowid, changes() AS changes',
        [],
      ) ?? { lastInsertRowid: 0, changes: 0 };

    if (!this.inTransaction) {
      this.persist();
    }

    return {
      lastInsertRowid: Number(meta.lastInsertRowid ?? 0),
      changes: Number(meta.changes ?? 0),
    };
  }

  get<T>(sql: string, params: SQLInputValue[]): T | undefined {
    this.assertOpen();
    const statement = this.database.prepare(sql);

    try {
      bindStatement(statement, params);

      if (!statement.step()) {
        return undefined;
      }

      return statement.getAsObject() as T;
    } finally {
      statement.free();
    }
  }

  all<T>(sql: string, params: SQLInputValue[]): T[] {
    this.assertOpen();
    const statement = this.database.prepare(sql);

    try {
      bindStatement(statement, params);
      const rows: T[] = [];

      while (statement.step()) {
        rows.push(statement.getAsObject() as T);
      }

      return rows;
    } finally {
      statement.free();
    }
  }

  private persist(): void {
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, Buffer.from(this.database.export()));
  }

  private assertOpen(): void {
    if (this.closed) {
      throw new Error('Database is already closed.');
    }
  }
}

export async function openDatabase(filePath: string): Promise<DatabaseSync> {
  const sqlModule = await getSqlModule();

  if (existsSync(filePath)) {
    const buffer = readFileSync(filePath);
    return new LegacyDatabase(filePath, new sqlModule.Database(buffer));
  }

  mkdirSync(dirname(filePath), { recursive: true });
  return new LegacyDatabase(filePath, new sqlModule.Database());
}
