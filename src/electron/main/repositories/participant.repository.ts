import type {
  ParticipantInput,
  ParticipantRecord,
  ParticipantType,
} from '../../../shared/participant.types';

import { allRows, getDb, getRow } from '../database/db';

interface ParticipantRow {
  id: number;
  full_name: string;
  participant_type: ParticipantType;
  group_name: string | null;
  position_or_subject: string | null;
  created_at: string;
}

function mapParticipant(row: ParticipantRow): ParticipantRecord {
  return {
    id: Number(row.id),
    fullName: row.full_name,
    participantType: row.participant_type,
    groupName: row.group_name,
    positionOrSubject: row.position_or_subject,
    createdAt: row.created_at,
  };
}

export function listParticipants(): ParticipantRecord[] {
  const rows = allRows<ParticipantRow>(
    getDb().prepare(
      `
        SELECT
          id,
          full_name,
          participant_type,
          group_name,
          position_or_subject,
          created_at
        FROM participants
        ORDER BY full_name ASC
      `,
    ),
  );

  return rows.map(mapParticipant);
}

export function getParticipantById(id: number): ParticipantRecord | null {
  const row = getRow<ParticipantRow>(
    getDb().prepare(
      `
        SELECT
          id,
          full_name,
          participant_type,
          group_name,
          position_or_subject,
          created_at
        FROM participants
        WHERE id = ?
        LIMIT 1
      `,
    ),
    id,
  );

  return row ? mapParticipant(row) : null;
}

export function createParticipant(input: ParticipantInput): ParticipantRecord {
  const createdAt = new Date().toISOString();
  const result = getDb()
    .prepare(
      `
        INSERT INTO participants (
          full_name,
          participant_type,
          group_name,
          position_or_subject,
          created_at
        )
        VALUES (?, ?, ?, ?, ?)
      `,
    )
    .run(
      input.fullName,
      input.participantType,
      input.groupName ?? null,
      input.positionOrSubject ?? null,
      createdAt,
    );

  const created = getParticipantById(Number(result.lastInsertRowid));

  if (!created) {
    throw new Error('Participant was not found after creation.');
  }

  return created;
}

export function updateParticipant(
  id: number,
  input: ParticipantInput,
): ParticipantRecord {
  getDb()
    .prepare(
      `
        UPDATE participants
        SET full_name = ?,
            participant_type = ?,
            group_name = ?,
            position_or_subject = ?
        WHERE id = ?
      `,
    )
    .run(
      input.fullName,
      input.participantType,
      input.groupName ?? null,
      input.positionOrSubject ?? null,
      id,
    );

  const updated = getParticipantById(id);

  if (!updated) {
    throw new Error('Participant was not found after update.');
  }

  return updated;
}

export function deleteParticipant(id: number): void {
  getDb().prepare(`DELETE FROM participants WHERE id = ?`).run(id);
}
