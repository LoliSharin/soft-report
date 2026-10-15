import type {
  ParticipationInput,
  ParticipationRecord,
} from '../../../shared/participation.types';
import type { ReportKind, ReportRow } from '../../../shared/report.types';

import { allRows, getDb, getRow } from '../database/db';

interface ParticipationRow {
  id: number;
  event_id: number;
  event_title: string;
  event_date: string;
  event_level_label: string;
  participant_id: number;
  participant_name: string;
  participant_type: 'teacher' | 'student';
  supervisor_id: number | null;
  supervisor_name: string | null;
  result_id: number;
  result_label: string;
  notes: string | null;
  certificate_image_name: string | null;
  created_at: string;
}

interface ReportRowDb {
  level: string;
  event_date: string;
  location: string;
  event_title: string;
  participant_name: string;
  participant_type: 'teacher' | 'student';
  supervisor_name: string | null;
  result_label: string;
}

interface PersistedParticipationInput {
  eventId: number;
  participantId: number;
  supervisorId?: number | null;
  resultId: number;
  notes?: string | null;
  certificateImageName: string | null;
}

function mapParticipation(row: ParticipationRow): ParticipationRecord {
  return {
    id: Number(row.id),
    eventId: Number(row.event_id),
    eventTitle: row.event_title,
    eventDate: row.event_date,
    eventLevelLabel: row.event_level_label,
    participantId: Number(row.participant_id),
    participantName: row.participant_name,
    participantType: row.participant_type,
    supervisorId: row.supervisor_id === null ? null : Number(row.supervisor_id),
    supervisorName: row.supervisor_name,
    resultId: Number(row.result_id),
    resultLabel: row.result_label,
    notes: row.notes,
    certificateImageName: row.certificate_image_name,
    createdAt: row.created_at,
  };
}

export function listParticipations(): ParticipationRecord[] {
  const rows = allRows<ParticipationRow>(
    getDb().prepare(
      `
        SELECT
          participations.id,
          events.id AS event_id,
          events.title AS event_title,
          events.event_date,
          levels.label AS event_level_label,
          participants.id AS participant_id,
          participants.full_name AS participant_name,
          participants.participant_type,
          supervisors.id AS supervisor_id,
          supervisors.full_name AS supervisor_name,
          results.id AS result_id,
          results.label AS result_label,
          participations.notes,
          participations.certificate_image_name,
          participations.created_at
        FROM participations
        INNER JOIN events ON events.id = participations.event_id
        INNER JOIN dictionaries AS levels ON levels.id = events.level_id
        INNER JOIN participants ON participants.id = participations.participant_id
        LEFT JOIN participants AS supervisors ON supervisors.id = participations.supervisor_id
        INNER JOIN dictionaries AS results ON results.id = participations.result_id
        ORDER BY events.event_date DESC, participants.full_name ASC
      `,
    ),
  );

  return rows.map(mapParticipation);
}

export function getParticipationById(id: number): ParticipationRecord | null {
  const row = getRow<ParticipationRow>(
    getDb().prepare(
      `
        SELECT
          participations.id,
          events.id AS event_id,
          events.title AS event_title,
          events.event_date,
          levels.label AS event_level_label,
          participants.id AS participant_id,
          participants.full_name AS participant_name,
          participants.participant_type,
          supervisors.id AS supervisor_id,
          supervisors.full_name AS supervisor_name,
          results.id AS result_id,
          results.label AS result_label,
          participations.notes,
          participations.certificate_image_name,
          participations.created_at
        FROM participations
        INNER JOIN events ON events.id = participations.event_id
        INNER JOIN dictionaries AS levels ON levels.id = events.level_id
        INNER JOIN participants ON participants.id = participations.participant_id
        LEFT JOIN participants AS supervisors ON supervisors.id = participations.supervisor_id
        INNER JOIN dictionaries AS results ON results.id = participations.result_id
        WHERE participations.id = ?
        LIMIT 1
      `,
    ),
    id,
  );

  return row ? mapParticipation(row) : null;
}

export function createParticipation(
  input: PersistedParticipationInput,
): ParticipationRecord {
  const createdAt = new Date().toISOString();
  const result = getDb()
    .prepare(
      `
        INSERT INTO participations (
          event_id,
          participant_id,
          supervisor_id,
          result_id,
          notes,
          certificate_image_name,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      input.eventId,
      input.participantId,
      input.supervisorId ?? null,
      input.resultId,
      input.notes ?? null,
      input.certificateImageName,
      createdAt,
    );

  const created = getParticipationById(Number(result.lastInsertRowid));

  if (!created) {
    throw new Error('Participation was not found after creation.');
  }

  return created;
}

export function updateParticipation(
  id: number,
  input: PersistedParticipationInput,
): ParticipationRecord {
  getDb()
    .prepare(
      `
        UPDATE participations
        SET event_id = ?,
            participant_id = ?,
            supervisor_id = ?,
            result_id = ?,
            notes = ?,
            certificate_image_name = ?
        WHERE id = ?
      `,
    )
    .run(
      input.eventId,
      input.participantId,
      input.supervisorId ?? null,
      input.resultId,
      input.notes ?? null,
      input.certificateImageName,
      id,
    );

  const updated = getParticipationById(id);

  if (!updated) {
    throw new Error('Participation was not found after update.');
  }

  return updated;
}

export function deleteParticipation(id: number): void {
  getDb().prepare(`DELETE FROM participations WHERE id = ?`).run(id);
}

export function listReportRows(kind: ReportKind, year: number | null): ReportRow[] {
  const whereClauses: string[] = [];
  const params: string[] = [];

  if (kind === 'teachers') {
    whereClauses.push(`participants.participant_type = 'teacher'`);
  }

  if (kind === 'students') {
    whereClauses.push(`participants.participant_type = 'student'`);
  }

  if (year !== null) {
    whereClauses.push(`substr(events.event_date, 1, 4) = ?`);
    params.push(String(year));
  }

  const whereClause =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const rows = allRows<ReportRowDb>(
    getDb().prepare(
      `
        SELECT
          levels.label AS level,
          events.event_date,
          events.location,
          events.title AS event_title,
          participants.full_name AS participant_name,
          participants.participant_type,
          supervisors.full_name AS supervisor_name,
          results.label AS result_label
        FROM participations
        INNER JOIN events ON events.id = participations.event_id
        INNER JOIN dictionaries AS levels ON levels.id = events.level_id
        INNER JOIN participants ON participants.id = participations.participant_id
        LEFT JOIN participants AS supervisors ON supervisors.id = participations.supervisor_id
        INNER JOIN dictionaries AS results ON results.id = participations.result_id
        ${whereClause}
        ORDER BY events.event_date DESC, participants.full_name ASC
      `,
    ),
    ...params,
  );

  return rows.map((row) => ({
    level: row.level,
    eventDate: row.event_date,
    location: row.location,
    eventTitle: row.event_title,
    participantName: row.participant_name,
    participantType: row.participant_type,
    supervisorName: row.supervisor_name,
    resultLabel: row.result_label,
  }));
}
