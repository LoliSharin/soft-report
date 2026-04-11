import type { CreateNoteInput, Note } from '../../shared/note.types';

import { getDb } from './db';

export function listNotes(): Note[] {
  const db = getDb();
  const rows = db.prepare(
    `
      SELECT
        id,
        title,
        created_at AS createdAt
      FROM notes
      ORDER BY id DESC
    `,
  ).all();

  return rows.map((row) => ({
    id: Number(row.id),
    title: String(row.title),
    createdAt: String(row.createdAt),
  }));
}

export function createNote(input: CreateNoteInput): Note {
  const title = input.title.trim();

  if (!title) {
    throw new Error('Note title is required.');
  }

  const db = getDb();
  const createdAt = new Date().toISOString();
  const result = db
    .prepare(
      `
        INSERT INTO notes (title, created_at)
        VALUES (?, ?)
      `,
    )
    .run(title, createdAt);

  return {
    id: Number(result.lastInsertRowid),
    title,
    createdAt,
  };
}
