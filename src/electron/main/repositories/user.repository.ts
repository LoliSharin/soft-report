import type { UserInput, UserRecord, UserRole } from '../../../shared/auth.types';

import { allRows, getDb, getRow } from '../database/db';

interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  is_active: number;
  created_at: string;
}

export interface StoredUser extends UserRecord {
  passwordHash: string;
}

function mapUser(row: UserRow): UserRecord {
  return {
    id: Number(row.id),
    username: row.username,
    fullName: row.full_name,
    role: row.role,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
  };
}

function mapStoredUser(row: UserRow): StoredUser {
  return {
    ...mapUser(row),
    passwordHash: row.password_hash,
  };
}

export function listUsers(): UserRecord[] {
  const rows = allRows<UserRow>(
    getDb().prepare(
      `
        SELECT id, username, password_hash, full_name, role, is_active, created_at
        FROM users
        ORDER BY username ASC
      `,
    ),
  );

  return rows.map(mapUser);
}

export function findUserByUsername(username: string): StoredUser | null {
  const row = getRow<UserRow>(
    getDb().prepare(
      `
        SELECT id, username, password_hash, full_name, role, is_active, created_at
        FROM users
        WHERE LOWER(username) = LOWER(?)
        LIMIT 1
      `,
    ),
    username,
  );

  return row ? mapStoredUser(row) : null;
}

export function getStoredUserById(id: number): StoredUser | null {
  const row = getRow<UserRow>(
    getDb().prepare(
      `
        SELECT id, username, password_hash, full_name, role, is_active, created_at
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
    ),
    id,
  );

  return row ? mapStoredUser(row) : null;
}

export function createUser(input: UserInput, passwordHash: string): UserRecord {
  const createdAt = new Date().toISOString();
  const result = getDb()
    .prepare(
      `
        INSERT INTO users (
          username,
          password_hash,
          full_name,
          role,
          is_active,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      input.username,
      passwordHash,
      input.fullName,
      input.role,
      input.isActive ? 1 : 0,
      createdAt,
    );

  return {
    id: Number(result.lastInsertRowid),
    username: input.username,
    fullName: input.fullName,
    role: input.role,
    isActive: input.isActive,
    createdAt,
  };
}

export function updateUser(
  id: number,
  input: UserInput,
  passwordHash?: string,
): UserRecord {
  getDb()
    .prepare(
      `
        UPDATE users
        SET username = ?,
            full_name = ?,
            role = ?,
            is_active = ?,
            password_hash = COALESCE(?, password_hash)
        WHERE id = ?
      `,
    )
    .run(
      input.username,
      input.fullName,
      input.role,
      input.isActive ? 1 : 0,
      passwordHash ?? null,
      id,
    );

  const updated = getStoredUserById(id);

  if (!updated) {
    throw new Error('User was not found after update.');
  }

  return updated;
}

export function deleteUser(id: number): void {
  getDb().prepare(`DELETE FROM users WHERE id = ?`).run(id);
}

export function countActiveAdmins(): number {
  const row = getDb()
    .prepare(
      `
        SELECT COUNT(*) AS count
        FROM users
        WHERE role = 'admin' AND is_active = 1
      `,
    )
    .get() as { count: number };

  return Number(row.count);
}
