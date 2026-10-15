import type { DatabaseSync } from './sqlite-compat';

interface CountRow {
  count: number;
}

function ensureDictionaryExists(
  db: DatabaseSync,
  type: string,
  code: string,
  label: string,
  sortOrder: number,
): void {
  const row = db
    .prepare(`SELECT COUNT(*) AS count FROM dictionaries WHERE type = ? AND code = ?`)
    .get(type, code) as CountRow | undefined;

  if (Number(row?.count ?? 0) > 0) {
    return;
  }

  db.prepare(
    `
      INSERT INTO dictionaries (type, code, label, sort_order, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
  ).run(type, code, label, sortOrder, 1, new Date().toISOString());
}

function updateDictionaryLabel(
  db: DatabaseSync,
  code: string,
  label: string,
): void {
  db.prepare(`UPDATE dictionaries SET label = ? WHERE code = ?`).run(label, code);
}

function updateUserFullName(
  db: DatabaseSync,
  username: string,
  fullName: string,
): void {
  db.prepare(`UPDATE users SET full_name = ? WHERE username = ?`).run(
    fullName,
    username,
  );
}

function updateParticipantName(
  db: DatabaseSync,
  oldName: string,
  newName: string,
): void {
  db.prepare(`UPDATE participants SET full_name = ? WHERE full_name = ?`).run(
    newName,
    oldName,
  );
}

function updateParticipantSubject(
  db: DatabaseSync,
  participantName: string,
  subject: string,
): void {
  db.prepare(
    `
      UPDATE participants
      SET position_or_subject = ?
      WHERE full_name = ?
    `,
  ).run(subject, participantName);
}

function updateEventTitle(
  db: DatabaseSync,
  oldTitle: string,
  newTitle: string,
): void {
  db.prepare(`UPDATE events SET title = ? WHERE title = ?`).run(newTitle, oldTitle);
}

function updateEventLocation(
  db: DatabaseSync,
  title: string,
  location: string,
): void {
  db.prepare(`UPDATE events SET location = ? WHERE title = ?`).run(location, title);
}

function updateParticipationNotes(
  db: DatabaseSync,
  oldNotes: string,
  newNotes: string,
): void {
  db.prepare(`UPDATE participations SET notes = ? WHERE notes = ?`).run(
    newNotes,
    oldNotes,
  );
}

export function runDataMigrations(db: DatabaseSync): void {
  db.exec('BEGIN');

  try {
    updateUserFullName(
      db,
      'admin',
      '\u0421\u0438\u0441\u0442\u0435\u043c\u043d\u044b\u0439 \u0430\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440',
    );
    updateUserFullName(
      db,
      'methodist',
      '\u041c\u0435\u0442\u043e\u0434\u0438\u0441\u0442 \u043f\u043e \u0443\u043c\u043e\u043b\u0447\u0430\u043d\u0438\u044e',
    );

    updateDictionaryLabel(
      db,
      'school',
      '\u0428\u043a\u043e\u043b\u044c\u043d\u044b\u0439',
    );
    updateDictionaryLabel(
      db,
      'city',
      '\u0413\u043e\u0440\u043e\u0434\u0441\u043a\u043e\u0439',
    );
    updateDictionaryLabel(
      db,
      'regional',
      '\u0420\u0435\u0433\u0438\u043e\u043d\u0430\u043b\u044c\u043d\u044b\u0439',
    );
    updateDictionaryLabel(
      db,
      'national',
      '\u0412\u0441\u0435\u0440\u043e\u0441\u0441\u0438\u0439\u0441\u043a\u0438\u0439',
    );
    ensureDictionaryExists(
      db,
      'event_level',
      'international',
      '\u041c\u0435\u0436\u0434\u0443\u043d\u0430\u0440\u043e\u0434\u043d\u044b\u0439',
      5,
    );
    updateDictionaryLabel(
      db,
      'international',
      '\u041c\u0435\u0436\u0434\u0443\u043d\u0430\u0440\u043e\u0434\u043d\u044b\u0439',
    );
    updateDictionaryLabel(
      db,
      'certificate',
      '\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043a\u0430\u0442',
    );
    updateDictionaryLabel(
      db,
      'diploma',
      '\u0414\u0438\u043f\u043b\u043e\u043c',
    );
    updateDictionaryLabel(db, 'first_place', '1 \u043c\u0435\u0441\u0442\u043e');
    updateDictionaryLabel(db, 'second_place', '2 \u043c\u0435\u0441\u0442\u043e');
    updateDictionaryLabel(db, 'third_place', '3 \u043c\u0435\u0441\u0442\u043e');

    updateParticipantName(
      db,
      'Irina Petrova',
      '\u0418\u0440\u0438\u043d\u0430 \u041f\u0435\u0442\u0440\u043e\u0432\u0430',
    );
    updateParticipantName(
      db,
      'Sergey Ivanov',
      '\u0421\u0435\u0440\u0433\u0435\u0439 \u0418\u0432\u0430\u043d\u043e\u0432',
    );
    updateParticipantName(
      db,
      'Anna Smirnova',
      '\u0410\u043d\u043d\u0430 \u0421\u043c\u0438\u0440\u043d\u043e\u0432\u0430',
    );
    updateParticipantName(
      db,
      'Dmitry Volkov',
      '\u0414\u043c\u0438\u0442\u0440\u0438\u0439 \u0412\u043e\u043b\u043a\u043e\u0432',
    );
    updateParticipantName(
      db,
      'Olga Sidorova',
      '\u041e\u043b\u044c\u0433\u0430 \u0421\u0438\u0434\u043e\u0440\u043e\u0432\u0430',
    );

    updateParticipantSubject(
      db,
      '\u0418\u0440\u0438\u043d\u0430 \u041f\u0435\u0442\u0440\u043e\u0432\u0430',
      '\u043f\u0440\u0435\u043f\u043e\u0434\u0430\u0432\u0430\u0442\u0435\u043b\u044c \u043c\u0430\u0442\u0435\u043c\u0430\u0442\u0438\u043a\u0438',
    );
    updateParticipantSubject(
      db,
      '\u0421\u0435\u0440\u0433\u0435\u0439 \u0418\u0432\u0430\u043d\u043e\u0432',
      '\u043f\u0440\u0435\u043f\u043e\u0434\u0430\u0432\u0430\u0442\u0435\u043b\u044c \u0438\u0441\u0442\u043e\u0440\u0438\u0438',
    );

    updateEventTitle(
      db,
      'Applied Informatics Olympiad',
      '\u041e\u043b\u0438\u043c\u043f\u0438\u0430\u0434\u0430 \u043f\u043e \u043f\u0440\u0438\u043a\u043b\u0430\u0434\u043d\u043e\u0439 \u0438\u043d\u0444\u043e\u0440\u043c\u0430\u0442\u0438\u043a\u0435',
    );
    updateEventTitle(
      db,
      'Regional Research Conference',
      '\u0420\u0435\u0433\u0438\u043e\u043d\u0430\u043b\u044c\u043d\u0430\u044f \u043d\u0430\u0443\u0447\u043d\u043e-\u043f\u0440\u0430\u043a\u0442\u0438\u0447\u0435\u0441\u043a\u0430\u044f \u043a\u043e\u043d\u0444\u0435\u0440\u0435\u043d\u0446\u0438\u044f',
    );
    updateEventTitle(
      db,
      'National Skills Championship',
      '\u0412\u0441\u0435\u0440\u043e\u0441\u0441\u0438\u0439\u0441\u043a\u0438\u0439 \u0447\u0435\u043c\u043f\u0438\u043e\u043d\u0430\u0442 \u043f\u0440\u043e\u0444\u0435\u0441\u0441\u0438\u043e\u043d\u0430\u043b\u044c\u043d\u043e\u0433\u043e \u043c\u0430\u0441\u0442\u0435\u0440\u0441\u0442\u0432\u0430',
    );

    updateEventLocation(
      db,
      '\u041e\u043b\u0438\u043c\u043f\u0438\u0430\u0434\u0430 \u043f\u043e \u043f\u0440\u0438\u043a\u043b\u0430\u0434\u043d\u043e\u0439 \u0438\u043d\u0444\u043e\u0440\u043c\u0430\u0442\u0438\u043a\u0435',
      '\u042f\u043a\u0443\u0442\u0441\u043a',
    );
    updateEventLocation(
      db,
      '\u0420\u0435\u0433\u0438\u043e\u043d\u0430\u043b\u044c\u043d\u0430\u044f \u043d\u0430\u0443\u0447\u043d\u043e-\u043f\u0440\u0430\u043a\u0442\u0438\u0447\u0435\u0441\u043a\u0430\u044f \u043a\u043e\u043d\u0444\u0435\u0440\u0435\u043d\u0446\u0438\u044f',
      '\u041c\u0438\u0440\u043d\u044b\u0439',
    );
    updateEventLocation(
      db,
      '\u0412\u0441\u0435\u0440\u043e\u0441\u0441\u0438\u0439\u0441\u043a\u0438\u0439 \u0447\u0435\u043c\u043f\u0438\u043e\u043d\u0430\u0442 \u043f\u0440\u043e\u0444\u0435\u0441\u0441\u0438\u043e\u043d\u0430\u043b\u044c\u043d\u043e\u0433\u043e \u043c\u0430\u0441\u0442\u0435\u0440\u0441\u0442\u0432\u0430',
      '\u041c\u043e\u0441\u043a\u0432\u0430',
    );

    updateParticipationNotes(
      db,
      'Team project presentation',
      '\u0417\u0430\u0449\u0438\u0442\u0430 \u043a\u043e\u043c\u0430\u043d\u0434\u043d\u043e\u0433\u043e \u043f\u0440\u043e\u0435\u043a\u0442\u0430',
    );
    updateParticipationNotes(
      db,
      'Research publication',
      '\u0418\u0441\u0441\u043b\u0435\u0434\u043e\u0432\u0430\u0442\u0435\u043b\u044c\u0441\u043a\u0430\u044f \u043f\u0443\u0431\u043b\u0438\u043a\u0430\u0446\u0438\u044f',
    );
    updateParticipationNotes(
      db,
      'Teacher mentorship award',
      '\u041d\u0430\u0433\u0440\u0430\u0434\u0430 \u0437\u0430 \u043d\u0430\u0441\u0442\u0430\u0432\u043d\u0438\u0447\u0435\u0441\u0442\u0432\u043e',
    );
    updateParticipationNotes(
      db,
      'Individual competition',
      '\u0418\u043d\u0434\u0438\u0432\u0438\u0434\u0443\u0430\u043b\u044c\u043d\u043e\u0435 \u0441\u043e\u0440\u0435\u0432\u043d\u043e\u0432\u0430\u043d\u0438\u0435',
    );
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
