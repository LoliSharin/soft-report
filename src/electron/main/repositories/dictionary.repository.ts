import type {
  DictionaryInput,
  DictionaryRecord,
  DictionaryType,
} from '../../../shared/dictionary.types';

import { allRows, getDb, getRow } from '../database/db';

interface DictionaryRow {
  id: number;
  type: DictionaryType;
  code: string;
  label: string;
  sort_order: number;
  is_active: number;
  created_at: string;
}

function mapDictionary(row: DictionaryRow): DictionaryRecord {
  return {
    id: Number(row.id),
    type: row.type,
    code: row.code,
    label: row.label,
    sortOrder: Number(row.sort_order),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
  };
}

export function listDictionaries(type?: DictionaryType): DictionaryRecord[] {
  const sql = `
    SELECT id, type, code, label, sort_order, is_active, created_at
    FROM dictionaries
    ${type ? 'WHERE type = ?' : ''}
    ORDER BY type ASC, sort_order ASC, label ASC
  `;
  const rows = type
    ? allRows<DictionaryRow>(getDb().prepare(sql), type)
    : allRows<DictionaryRow>(getDb().prepare(sql));

  return rows.map(mapDictionary);
}

export function getDictionaryById(id: number): DictionaryRecord | null {
  const row = getRow<DictionaryRow>(
    getDb().prepare(
      `
        SELECT id, type, code, label, sort_order, is_active, created_at
        FROM dictionaries
        WHERE id = ?
        LIMIT 1
      `,
    ),
    id,
  );

  return row ? mapDictionary(row) : null;
}

export function createDictionary(
  input: DictionaryInput,
  code: string,
): DictionaryRecord {
  const createdAt = new Date().toISOString();
  const result = getDb()
    .prepare(
      `
        INSERT INTO dictionaries (type, code, label, sort_order, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      input.type,
      code,
      input.label,
      input.sortOrder,
      input.isActive ? 1 : 0,
      createdAt,
    );

  return {
    id: Number(result.lastInsertRowid),
    type: input.type,
    code,
    label: input.label,
    sortOrder: input.sortOrder,
    isActive: input.isActive,
    createdAt,
  };
}

export function updateDictionary(
  id: number,
  input: DictionaryInput,
): DictionaryRecord {
  getDb()
    .prepare(
      `
        UPDATE dictionaries
        SET type = ?,
            label = ?,
            sort_order = ?,
            is_active = ?
        WHERE id = ?
      `,
    )
    .run(input.type, input.label, input.sortOrder, input.isActive ? 1 : 0, id);

  const updated = getDictionaryById(id);

  if (!updated) {
    throw new Error('Dictionary item was not found after update.');
  }

  return updated;
}

export function deleteDictionary(id: number): void {
  getDb().prepare(`DELETE FROM dictionaries WHERE id = ?`).run(id);
}
