import type { EventInput, EventRecord } from '../../../shared/event.types';

import { allRows, getDb, getRow } from '../database/db';

interface EventRow {
  id: number;
  level_id: number;
  level_label: string;
  event_date: string;
  location: string;
  title: string;
  created_at: string;
}

function mapEvent(row: EventRow): EventRecord {
  return {
    id: Number(row.id),
    levelId: Number(row.level_id),
    levelLabel: row.level_label,
    eventDate: row.event_date,
    location: row.location,
    title: row.title,
    createdAt: row.created_at,
  };
}

export function listEvents(): EventRecord[] {
  const rows = allRows<EventRow>(
    getDb().prepare(
      `
        SELECT
          events.id,
          events.level_id,
          dictionaries.label AS level_label,
          events.event_date,
          events.location,
          events.title,
          events.created_at
        FROM events
        INNER JOIN dictionaries ON dictionaries.id = events.level_id
        ORDER BY events.event_date DESC, events.title ASC
      `,
    ),
  );

  return rows.map(mapEvent);
}

export function getEventById(id: number): EventRecord | null {
  const row = getRow<EventRow>(
    getDb().prepare(
      `
        SELECT
          events.id,
          events.level_id,
          dictionaries.label AS level_label,
          events.event_date,
          events.location,
          events.title,
          events.created_at
        FROM events
        INNER JOIN dictionaries ON dictionaries.id = events.level_id
        WHERE events.id = ?
        LIMIT 1
      `,
    ),
    id,
  );

  return row ? mapEvent(row) : null;
}

export function createEvent(input: EventInput): EventRecord {
  const createdAt = new Date().toISOString();
  const result = getDb()
    .prepare(
      `
        INSERT INTO events (level_id, event_date, location, title, created_at)
        VALUES (?, ?, ?, ?, ?)
      `,
    )
    .run(input.levelId, input.eventDate, input.location, input.title, createdAt);

  const created = getEventById(Number(result.lastInsertRowid));

  if (!created) {
    throw new Error('Event was not found after creation.');
  }

  return created;
}

export function updateEvent(id: number, input: EventInput): EventRecord {
  getDb()
    .prepare(
      `
        UPDATE events
        SET level_id = ?,
            event_date = ?,
            location = ?,
            title = ?
        WHERE id = ?
      `,
    )
    .run(input.levelId, input.eventDate, input.location, input.title, id);

  const updated = getEventById(id);

  if (!updated) {
    throw new Error('Event was not found after update.');
  }

  return updated;
}

export function deleteEvent(id: number): void {
  getDb().prepare(`DELETE FROM events WHERE id = ?`).run(id);
}
