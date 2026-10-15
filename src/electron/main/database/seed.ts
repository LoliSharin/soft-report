import type { DatabaseSync } from './sqlite-compat';

import { hashPassword } from '../services/password.service';

interface IdRow {
  id: number;
}

function getCount(db: DatabaseSync, tableName: string): number {
  const row = db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get() as {
    count: number;
  };

  return Number(row.count);
}

function getIdByValue(
  db: DatabaseSync,
  tableName: string,
  columnName: string,
  value: string,
): number {
  const row = db
    .prepare(`SELECT id FROM ${tableName} WHERE ${columnName} = ? LIMIT 1`)
    .get(value) as IdRow | undefined;

  if (!row) {
    throw new Error(`Failed to resolve id in ${tableName} for ${value}.`);
  }

  return Number(row.id);
}

export function seedDatabase(db: DatabaseSync): void {
  if (getCount(db, 'users') === 0) {
    const now = new Date().toISOString();
    const insertUser = db.prepare(`
      INSERT INTO users (username, password_hash, full_name, role, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertUser.run(
      'admin',
      hashPassword('admin123'),
      '\u0421\u0438\u0441\u0442\u0435\u043c\u043d\u044b\u0439 \u0430\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440',
      'admin',
      1,
      now,
    );
    insertUser.run(
      'methodist',
      hashPassword('user123'),
      '\u041c\u0435\u0442\u043e\u0434\u0438\u0441\u0442 \u043f\u043e \u0443\u043c\u043e\u043b\u0447\u0430\u043d\u0438\u044e',
      'user',
      1,
      now,
    );
  }

  if (getCount(db, 'dictionaries') === 0) {
    const now = new Date().toISOString();
    const insertDictionary = db.prepare(`
      INSERT INTO dictionaries (type, code, label, sort_order, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const levels = [
      ['event_level', 'school', '\u0428\u043a\u043e\u043b\u044c\u043d\u044b\u0439', 1],
      ['event_level', 'city', '\u0413\u043e\u0440\u043e\u0434\u0441\u043a\u043e\u0439', 2],
      ['event_level', 'regional', '\u0420\u0435\u0433\u0438\u043e\u043d\u0430\u043b\u044c\u043d\u044b\u0439', 3],
      ['event_level', 'national', '\u0412\u0441\u0435\u0440\u043e\u0441\u0441\u0438\u0439\u0441\u043a\u0438\u0439', 4],
      ['event_level', 'international', '\u041c\u0435\u0436\u0434\u0443\u043d\u0430\u0440\u043e\u0434\u043d\u044b\u0439', 5],
    ] as const;

    const results = [
      ['participation_result', 'certificate', '\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043a\u0430\u0442', 1],
      ['participation_result', 'diploma', '\u0414\u0438\u043f\u043b\u043e\u043c', 2],
      ['participation_result', 'first_place', '1 \u043c\u0435\u0441\u0442\u043e', 3],
      ['participation_result', 'second_place', '2 \u043c\u0435\u0441\u0442\u043e', 4],
      ['participation_result', 'third_place', '3 \u043c\u0435\u0441\u0442\u043e', 5],
    ] as const;

    [...levels, ...results].forEach(([type, code, label, sortOrder]) => {
      insertDictionary.run(type, code, label, sortOrder, 1, now);
    });
  }

  if (getCount(db, 'participants') === 0) {
    const now = new Date().toISOString();
    const insertParticipant = db.prepare(`
      INSERT INTO participants (
        full_name,
        participant_type,
        group_name,
        position_or_subject,
        created_at
      )
      VALUES (?, ?, ?, ?, ?)
    `);

    insertParticipant.run(
      '\u0418\u0440\u0438\u043d\u0430 \u041f\u0435\u0442\u0440\u043e\u0432\u0430',
      'teacher',
      null,
      '\u043f\u0440\u0435\u043f\u043e\u0434\u0430\u0432\u0430\u0442\u0435\u043b\u044c \u043c\u0430\u0442\u0435\u043c\u0430\u0442\u0438\u043a\u0438',
      now,
    );
    insertParticipant.run(
      '\u0421\u0435\u0440\u0433\u0435\u0439 \u0418\u0432\u0430\u043d\u043e\u0432',
      'teacher',
      null,
      '\u043f\u0440\u0435\u043f\u043e\u0434\u0430\u0432\u0430\u0442\u0435\u043b\u044c \u0438\u0441\u0442\u043e\u0440\u0438\u0438',
      now,
    );
    insertParticipant.run('\u0410\u043d\u043d\u0430 \u0421\u043c\u0438\u0440\u043d\u043e\u0432\u0430', 'student', 'IS-21', null, now);
    insertParticipant.run('\u0414\u043c\u0438\u0442\u0440\u0438\u0439 \u0412\u043e\u043b\u043a\u043e\u0432', 'student', 'IS-22', null, now);
    insertParticipant.run('\u041e\u043b\u044c\u0433\u0430 \u0421\u0438\u0434\u043e\u0440\u043e\u0432\u0430', 'student', 'IS-23', null, now);
  }

  if (getCount(db, 'events') === 0) {
    const now = new Date().toISOString();
    const insertEvent = db.prepare(`
      INSERT INTO events (level_id, event_date, location, title, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertEvent.run(
      getIdByValue(db, 'dictionaries', 'code', 'city'),
      '2026-02-14',
      '\u042f\u043a\u0443\u0442\u0441\u043a',
      '\u041e\u043b\u0438\u043c\u043f\u0438\u0430\u0434\u0430 \u043f\u043e \u043f\u0440\u0438\u043a\u043b\u0430\u0434\u043d\u043e\u0439 \u0438\u043d\u0444\u043e\u0440\u043c\u0430\u0442\u0438\u043a\u0435',
      now,
    );
    insertEvent.run(
      getIdByValue(db, 'dictionaries', 'code', 'regional'),
      '2026-03-11',
      '\u041c\u0438\u0440\u043d\u044b\u0439',
      '\u0420\u0435\u0433\u0438\u043e\u043d\u0430\u043b\u044c\u043d\u0430\u044f \u043d\u0430\u0443\u0447\u043d\u043e-\u043f\u0440\u0430\u043a\u0442\u0438\u0447\u0435\u0441\u043a\u0430\u044f \u043a\u043e\u043d\u0444\u0435\u0440\u0435\u043d\u0446\u0438\u044f',
      now,
    );
    insertEvent.run(
      getIdByValue(db, 'dictionaries', 'code', 'national'),
      '2026-04-03',
      '\u041c\u043e\u0441\u043a\u0432\u0430',
      '\u0412\u0441\u0435\u0440\u043e\u0441\u0441\u0438\u0439\u0441\u043a\u0438\u0439 \u0447\u0435\u043c\u043f\u0438\u043e\u043d\u0430\u0442 \u043f\u0440\u043e\u0444\u0435\u0441\u0441\u0438\u043e\u043d\u0430\u043b\u044c\u043d\u043e\u0433\u043e \u043c\u0430\u0441\u0442\u0435\u0440\u0441\u0442\u0432\u0430',
      now,
    );
  }

  if (getCount(db, 'participations') === 0) {
    const now = new Date().toISOString();
    const insertParticipation = db.prepare(`
      INSERT INTO participations (
        event_id,
        participant_id,
        supervisor_id,
        result_id,
        notes,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const teacherIrinaId = getIdByValue(
      db,
      'participants',
      'full_name',
      '\u0418\u0440\u0438\u043d\u0430 \u041f\u0435\u0442\u0440\u043e\u0432\u0430',
    );
    const teacherSergeyId = getIdByValue(
      db,
      'participants',
      'full_name',
      '\u0421\u0435\u0440\u0433\u0435\u0439 \u0418\u0432\u0430\u043d\u043e\u0432',
    );
    const annaId = getIdByValue(db, 'participants', 'full_name', '\u0410\u043d\u043d\u0430 \u0421\u043c\u0438\u0440\u043d\u043e\u0432\u0430');
    const dmitryId = getIdByValue(
      db,
      'participants',
      'full_name',
      '\u0414\u043c\u0438\u0442\u0440\u0438\u0439 \u0412\u043e\u043b\u043a\u043e\u0432',
    );
    const olgaId = getIdByValue(db, 'participants', 'full_name', '\u041e\u043b\u044c\u0433\u0430 \u0421\u0438\u0434\u043e\u0440\u043e\u0432\u0430');

    const olympiadId = getIdByValue(
      db,
      'events',
      'title',
      '\u041e\u043b\u0438\u043c\u043f\u0438\u0430\u0434\u0430 \u043f\u043e \u043f\u0440\u0438\u043a\u043b\u0430\u0434\u043d\u043e\u0439 \u0438\u043d\u0444\u043e\u0440\u043c\u0430\u0442\u0438\u043a\u0435',
    );
    const conferenceId = getIdByValue(
      db,
      'events',
      'title',
      '\u0420\u0435\u0433\u0438\u043e\u043d\u0430\u043b\u044c\u043d\u0430\u044f \u043d\u0430\u0443\u0447\u043d\u043e-\u043f\u0440\u0430\u043a\u0442\u0438\u0447\u0435\u0441\u043a\u0430\u044f \u043a\u043e\u043d\u0444\u0435\u0440\u0435\u043d\u0446\u0438\u044f',
    );
    const championshipId = getIdByValue(
      db,
      'events',
      'title',
      '\u0412\u0441\u0435\u0440\u043e\u0441\u0441\u0438\u0439\u0441\u043a\u0438\u0439 \u0447\u0435\u043c\u043f\u0438\u043e\u043d\u0430\u0442 \u043f\u0440\u043e\u0444\u0435\u0441\u0441\u0438\u043e\u043d\u0430\u043b\u044c\u043d\u043e\u0433\u043e \u043c\u0430\u0441\u0442\u0435\u0440\u0441\u0442\u0432\u0430',
    );

    const diplomaId = getIdByValue(
      db,
      'dictionaries',
      'code',
      'diploma',
    );
    const firstPlaceId = getIdByValue(
      db,
      'dictionaries',
      'code',
      'first_place',
    );
    const certificateId = getIdByValue(
      db,
      'dictionaries',
      'code',
      'certificate',
    );

    insertParticipation.run(
      olympiadId,
      annaId,
      teacherIrinaId,
      diplomaId,
      '\u0417\u0430\u0449\u0438\u0442\u0430 \u043a\u043e\u043c\u0430\u043d\u0434\u043d\u043e\u0433\u043e \u043f\u0440\u043e\u0435\u043a\u0442\u0430',
      now,
    );
    insertParticipation.run(
      conferenceId,
      dmitryId,
      teacherSergeyId,
      certificateId,
      '\u0418\u0441\u0441\u043b\u0435\u0434\u043e\u0432\u0430\u0442\u0435\u043b\u044c\u0441\u043a\u0430\u044f \u043f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u044f',
      now,
    );
    insertParticipation.run(
      championshipId,
      teacherIrinaId,
      null,
      firstPlaceId,
      '\u041d\u0430\u0433\u0440\u0430\u0434\u0430 \u0437\u0430 \u043d\u0430\u0441\u0442\u0430\u0432\u043d\u0438\u0447\u0435\u0441\u0442\u0432\u043e',
      now,
    );
    insertParticipation.run(
      championshipId,
      olgaId,
      teacherIrinaId,
      firstPlaceId,
      '\u0418\u043d\u0434\u0438\u0432\u0438\u0434\u0443\u0430\u043b\u044c\u043d\u043e\u0435 \u0441\u043e\u0440\u0435\u0432\u043d\u043e\u0432\u0430\u043d\u0438\u0435',
      now,
    );
  }
}
