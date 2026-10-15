import { existsSync } from 'node:fs';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';

import { randomUUID } from 'node:crypto';

import { app, dialog, type BrowserWindow } from 'electron';

import { appConfig } from '../../../shared/app.config';
import type { DictionaryType } from '../../../shared/dictionary.types';
import type { ParticipantType } from '../../../shared/participant.types';
import type {
  DataExportResult,
  DataImportResult,
  DataImportStats,
} from '../../../shared/report.types';

import { allRows, getDatabasePath, getDb, getRow } from '../database/db';

import { requireAdminSession } from './session.service';

const TRANSFER_FORMAT = 'soft-report-data-transfer';
const TRANSFER_VERSION = 1;

interface ExportDictionary {
  type: DictionaryType;
  code: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}

interface ExportEvent {
  levelCode: string;
  eventDate: string;
  location: string;
  title: string;
}

interface ExportParticipant {
  fullName: string;
  participantType: ParticipantType;
  groupName: string | null;
  positionOrSubject: string | null;
}

interface ExportCertificate {
  fileName: string;
  dataBase64: string;
}

interface ExportParticipation {
  event: ExportEvent;
  participant: ExportParticipant;
  supervisor: ExportParticipant | null;
  resultCode: string;
  notes: string | null;
  certificate: ExportCertificate | null;
}

interface TransferPackage {
  format: typeof TRANSFER_FORMAT;
  version: typeof TRANSFER_VERSION;
  exportedAt: string;
  appName: string;
  data: {
    dictionaries: ExportDictionary[];
    events: ExportEvent[];
    participants: ExportParticipant[];
    participations: ExportParticipation[];
  };
}

interface DictionaryExportRow {
  type: DictionaryType;
  code: string;
  label: string;
  sort_order: number;
  is_active: number;
}

interface EventExportRow {
  level_code: string;
  event_date: string;
  location: string;
  title: string;
}

interface ParticipantExportRow {
  full_name: string;
  participant_type: ParticipantType;
  group_name: string | null;
  position_or_subject: string | null;
}

interface ParticipationExportRow {
  level_code: string;
  event_date: string;
  location: string;
  event_title: string;
  participant_name: string;
  participant_type: ParticipantType;
  participant_group_name: string | null;
  participant_position_or_subject: string | null;
  supervisor_name: string | null;
  supervisor_type: ParticipantType | null;
  supervisor_group_name: string | null;
  supervisor_position_or_subject: string | null;
  result_code: string;
  notes: string | null;
  certificate_image_name: string | null;
}

interface IdRow {
  id: number;
}

function createTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function createEmptyStats(): DataImportStats {
  return {
    dictionaries: 0,
    events: 0,
    participants: 0,
    participations: 0,
    certificates: 0,
  };
}

function getCertificatesDirectory(): string {
  return join(
    app.getPath('userData'),
    appConfig.storage.participationCertificatesDir,
  );
}

function getStoredCertificatePath(fileName: string): string {
  return join(getCertificatesDirectory(), fileName);
}

async function createImportBackup(): Promise<string> {
  const backupDirectory = join(app.getPath('userData'), 'import-backups');
  await mkdir(backupDirectory, { recursive: true });

  const backupPath = join(
    backupDirectory,
    `${appConfig.database.backupPrefix}-before-import-${createTimestamp()}.db`,
  );

  await copyFile(getDatabasePath(), backupPath);

  return backupPath;
}

function sanitizeFileName(fileName: string): string {
  const extension = extname(fileName).toLowerCase();
  const baseName = basename(fileName, extension)
    .trim()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  return `${baseName || 'certificate'}${extension || '.png'}`;
}

async function createUniqueCertificateFileName(fileName: string): Promise<string> {
  await mkdir(getCertificatesDirectory(), { recursive: true });

  const safeFileName = sanitizeFileName(fileName);
  const extension = extname(safeFileName);
  const baseName = basename(safeFileName, extension);
  let candidate = safeFileName;
  let index = 1;

  while (existsSync(getStoredCertificatePath(candidate))) {
    candidate = `${baseName}-${index}${extension}`;
    index += 1;
  }

  return candidate;
}

async function readCertificate(fileName: string | null): Promise<ExportCertificate | null> {
  if (!fileName) {
    return null;
  }

  try {
    const fileBuffer = await readFile(getStoredCertificatePath(fileName));

    return {
      fileName,
      dataBase64: fileBuffer.toString('base64'),
    };
  } catch {
    return null;
  }
}

async function writeCertificate(
  certificate: ExportCertificate | null,
): Promise<string | null> {
  if (!certificate) {
    return null;
  }

  const fileName = await createUniqueCertificateFileName(certificate.fileName);
  const fileBuffer = Buffer.from(certificate.dataBase64, 'base64');

  await writeFile(getStoredCertificatePath(fileName), fileBuffer);

  return fileName;
}

function participantFromRow(
  row: Pick<
    ParticipationExportRow,
    | 'participant_name'
    | 'participant_type'
    | 'participant_group_name'
    | 'participant_position_or_subject'
  >,
): ExportParticipant {
  return {
    fullName: row.participant_name,
    participantType: row.participant_type,
    groupName: row.participant_group_name,
    positionOrSubject: row.participant_position_or_subject,
  };
}

function supervisorFromRow(row: ParticipationExportRow): ExportParticipant | null {
  if (!row.supervisor_name || !row.supervisor_type) {
    return null;
  }

  return {
    fullName: row.supervisor_name,
    participantType: row.supervisor_type,
    groupName: row.supervisor_group_name,
    positionOrSubject: row.supervisor_position_or_subject,
  };
}

function eventFromRow(row: ParticipationExportRow): ExportEvent {
  return {
    levelCode: row.level_code,
    eventDate: row.event_date,
    location: row.location,
    title: row.event_title,
  };
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = value.trim();

  return normalized || null;
}

function normalizeRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Некорректное поле импорта: ${fieldName}.`);
  }

  return value.trim();
}

function normalizeDictionary(dictionary: ExportDictionary): ExportDictionary {
  return {
    type: normalizeRequiredString(dictionary.type, 'dictionary.type') as DictionaryType,
    code: normalizeRequiredString(dictionary.code, 'dictionary.code'),
    label: normalizeRequiredString(dictionary.label, 'dictionary.label'),
    sortOrder: Number.isInteger(dictionary.sortOrder)
      ? dictionary.sortOrder
      : 0,
    isActive: Boolean(dictionary.isActive),
  };
}

function normalizeEvent(event: ExportEvent): ExportEvent {
  return {
    levelCode: normalizeRequiredString(event.levelCode, 'event.levelCode'),
    eventDate: normalizeRequiredString(event.eventDate, 'event.eventDate'),
    location: normalizeRequiredString(event.location, 'event.location'),
    title: normalizeRequiredString(event.title, 'event.title'),
  };
}

function normalizeParticipant(participant: ExportParticipant): ExportParticipant {
  return {
    fullName: normalizeRequiredString(participant.fullName, 'participant.fullName'),
    participantType: normalizeRequiredString(
      participant.participantType,
      'participant.participantType',
    ) as ParticipantType,
    groupName: normalizeOptionalString(participant.groupName),
    positionOrSubject: normalizeOptionalString(participant.positionOrSubject),
  };
}

function normalizeParticipation(
  participation: ExportParticipation,
): ExportParticipation {
  return {
    event: normalizeEvent(participation.event),
    participant: normalizeParticipant(participation.participant),
    supervisor: participation.supervisor
      ? normalizeParticipant(participation.supervisor)
      : null,
    resultCode: normalizeRequiredString(
      participation.resultCode,
      'participation.resultCode',
    ),
    notes: normalizeOptionalString(participation.notes),
    certificate:
      participation.certificate &&
      typeof participation.certificate.fileName === 'string' &&
      typeof participation.certificate.dataBase64 === 'string'
        ? participation.certificate
        : null,
  };
}

function dictionaryKey(type: DictionaryType, code: string): string {
  return `${type}:${code}`;
}

function eventKey(event: ExportEvent): string {
  return [
    event.levelCode,
    event.eventDate,
    event.location.trim().toLowerCase(),
    event.title.trim().toLowerCase(),
  ].join('|');
}

function participantKey(participant: ExportParticipant): string {
  return [
    participant.fullName.trim().toLowerCase(),
    participant.participantType,
    participant.groupName?.trim().toLowerCase() ?? '',
    participant.positionOrSubject?.trim().toLowerCase() ?? '',
  ].join('|');
}

function parseTransferPackage(rawJson: string): TransferPackage {
  const parsed = JSON.parse(rawJson) as TransferPackage;

  if (
    parsed.format !== TRANSFER_FORMAT ||
    parsed.version !== TRANSFER_VERSION ||
    !parsed.data ||
    !Array.isArray(parsed.data.dictionaries) ||
    !Array.isArray(parsed.data.events) ||
    !Array.isArray(parsed.data.participants) ||
    !Array.isArray(parsed.data.participations)
  ) {
    throw new Error('Выбранный файл не является корректным экспортом данных.');
  }

  return {
    ...parsed,
    data: {
      dictionaries: parsed.data.dictionaries.map(normalizeDictionary),
      events: parsed.data.events.map(normalizeEvent),
      participants: parsed.data.participants.map(normalizeParticipant),
      participations: parsed.data.participations.map(normalizeParticipation),
    },
  };
}

function findDictionaryId(type: DictionaryType, code: string): number | null {
  const row = getRow<IdRow>(
    getDb().prepare(
      `
        SELECT id
        FROM dictionaries
        WHERE type = ? AND code = ?
        LIMIT 1
      `,
    ),
    type,
    code,
  );

  return row ? Number(row.id) : null;
}

function insertDictionary(dictionary: ExportDictionary): number {
  const result = getDb()
    .prepare(
      `
        INSERT INTO dictionaries (type, code, label, sort_order, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      dictionary.type,
      dictionary.code,
      dictionary.label,
      dictionary.sortOrder,
      dictionary.isActive ? 1 : 0,
      new Date().toISOString(),
    );

  return Number(result.lastInsertRowid);
}

function resolveDictionaryId(
  dictionary: ExportDictionary,
  added: DataImportStats,
  skipped: DataImportStats,
): number {
  const existingId = findDictionaryId(dictionary.type, dictionary.code);

  if (existingId !== null) {
    skipped.dictionaries += 1;
    return existingId;
  }

  added.dictionaries += 1;
  return insertDictionary(dictionary);
}

function findEventId(event: ExportEvent, levelId: number): number | null {
  const row = getRow<IdRow>(
    getDb().prepare(
      `
        SELECT id
        FROM events
        WHERE level_id = ?
          AND event_date = ?
          AND lower(location) = lower(?)
          AND lower(title) = lower(?)
        LIMIT 1
      `,
    ),
    levelId,
    event.eventDate,
    event.location,
    event.title,
  );

  return row ? Number(row.id) : null;
}

function insertEvent(event: ExportEvent, levelId: number): number {
  const result = getDb()
    .prepare(
      `
        INSERT INTO events (level_id, event_date, location, title, created_at)
        VALUES (?, ?, ?, ?, ?)
      `,
    )
    .run(levelId, event.eventDate, event.location, event.title, new Date().toISOString());

  return Number(result.lastInsertRowid);
}

function findParticipantId(participant: ExportParticipant): number | null {
  const row = getRow<IdRow>(
    getDb().prepare(
      `
        SELECT id
        FROM participants
        WHERE lower(full_name) = lower(?)
          AND participant_type = ?
          AND lower(COALESCE(group_name, '')) = lower(?)
          AND lower(COALESCE(position_or_subject, '')) = lower(?)
        LIMIT 1
      `,
    ),
    participant.fullName,
    participant.participantType,
    participant.groupName ?? '',
    participant.positionOrSubject ?? '',
  );

  return row ? Number(row.id) : null;
}

function insertParticipant(participant: ExportParticipant): number {
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
      participant.fullName,
      participant.participantType,
      participant.groupName,
      participant.positionOrSubject,
      new Date().toISOString(),
    );

  return Number(result.lastInsertRowid);
}

function findParticipationId(
  eventId: number,
  participantId: number,
  supervisorId: number | null,
  resultId: number,
): number | null {
  const row = getRow<IdRow>(
    getDb().prepare(
      `
        SELECT id
        FROM participations
        WHERE event_id = ?
          AND participant_id = ?
          AND COALESCE(supervisor_id, 0) = ?
          AND result_id = ?
        LIMIT 1
      `,
    ),
    eventId,
    participantId,
    supervisorId ?? 0,
    resultId,
  );

  return row ? Number(row.id) : null;
}

function insertParticipation(
  participation: ExportParticipation,
  eventId: number,
  participantId: number,
  supervisorId: number | null,
  resultId: number,
  certificateImageName: string | null,
): void {
  getDb()
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
      eventId,
      participantId,
      supervisorId,
      resultId,
      participation.notes,
      certificateImageName,
      new Date().toISOString(),
    );
}

async function buildTransferPackage(): Promise<TransferPackage> {
  const dictionaries = allRows<DictionaryExportRow>(
    getDb().prepare(
      `
        SELECT type, code, label, sort_order, is_active
        FROM dictionaries
        ORDER BY type ASC, sort_order ASC, label ASC
      `,
    ),
  ).map((row) => ({
    type: row.type,
    code: row.code,
    label: row.label,
    sortOrder: Number(row.sort_order),
    isActive: Boolean(row.is_active),
  }));

  const events = allRows<EventExportRow>(
    getDb().prepare(
      `
        SELECT
          levels.code AS level_code,
          events.event_date,
          events.location,
          events.title
        FROM events
        INNER JOIN dictionaries AS levels ON levels.id = events.level_id
        ORDER BY events.event_date DESC, events.title ASC
      `,
    ),
  ).map((row) => ({
    levelCode: row.level_code,
    eventDate: row.event_date,
    location: row.location,
    title: row.title,
  }));

  const participants = allRows<ParticipantExportRow>(
    getDb().prepare(
      `
        SELECT full_name, participant_type, group_name, position_or_subject
        FROM participants
        ORDER BY full_name ASC
      `,
    ),
  ).map((row) => ({
    fullName: row.full_name,
    participantType: row.participant_type,
    groupName: row.group_name,
    positionOrSubject: row.position_or_subject,
  }));

  const participationRows = allRows<ParticipationExportRow>(
    getDb().prepare(
      `
        SELECT
          levels.code AS level_code,
          events.event_date,
          events.location,
          events.title AS event_title,
          participants.full_name AS participant_name,
          participants.participant_type,
          participants.group_name AS participant_group_name,
          participants.position_or_subject AS participant_position_or_subject,
          supervisors.full_name AS supervisor_name,
          supervisors.participant_type AS supervisor_type,
          supervisors.group_name AS supervisor_group_name,
          supervisors.position_or_subject AS supervisor_position_or_subject,
          results.code AS result_code,
          participations.notes,
          participations.certificate_image_name
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

  const participations = await Promise.all(
    participationRows.map(async (row) => ({
      event: eventFromRow(row),
      participant: participantFromRow(row),
      supervisor: supervisorFromRow(row),
      resultCode: row.result_code,
      notes: row.notes,
      certificate: await readCertificate(row.certificate_image_name),
    })),
  );

  return {
    format: TRANSFER_FORMAT,
    version: TRANSFER_VERSION,
    exportedAt: new Date().toISOString(),
    appName: appConfig.displayName,
    data: {
      dictionaries,
      events,
      participants,
      participations,
    },
  };
}

function ensureEvent(
  event: ExportEvent,
  dictionaryIds: Map<string, number>,
  eventIds: Map<string, number>,
  added: DataImportStats,
  skipped: DataImportStats,
): number {
  const key = eventKey(event);
  const cachedId = eventIds.get(key);

  if (cachedId) {
    return cachedId;
  }

  const levelId = dictionaryIds.get(dictionaryKey('event_level', event.levelCode));

  if (!levelId) {
    throw new Error(`Не найден уровень мероприятия: ${event.levelCode}.`);
  }

  const existingId = findEventId(event, levelId);

  if (existingId !== null) {
    skipped.events += 1;
    eventIds.set(key, existingId);
    return existingId;
  }

  const createdId = insertEvent(event, levelId);
  added.events += 1;
  eventIds.set(key, createdId);

  return createdId;
}

function ensureParticipant(
  participant: ExportParticipant,
  participantIds: Map<string, number>,
  added: DataImportStats,
  skipped: DataImportStats,
): number {
  const key = participantKey(participant);
  const cachedId = participantIds.get(key);

  if (cachedId) {
    return cachedId;
  }

  const existingId = findParticipantId(participant);

  if (existingId !== null) {
    skipped.participants += 1;
    participantIds.set(key, existingId);
    return existingId;
  }

  const createdId = insertParticipant(participant);
  added.participants += 1;
  participantIds.set(key, createdId);

  return createdId;
}

async function importPackage(
  transferPackage: TransferPackage,
): Promise<Omit<DataImportResult, 'filePath' | 'backupFilePath'>> {
  const added = createEmptyStats();
  const skipped = createEmptyStats();
  const dictionaryIds = new Map<string, number>();
  const eventIds = new Map<string, number>();
  const participantIds = new Map<string, number>();

  getDb().exec('BEGIN');

  try {
    for (const dictionary of transferPackage.data.dictionaries) {
      const id = resolveDictionaryId(dictionary, added, skipped);
      dictionaryIds.set(dictionaryKey(dictionary.type, dictionary.code), id);
    }

    for (const event of transferPackage.data.events) {
      ensureEvent(event, dictionaryIds, eventIds, added, skipped);
    }

    for (const participant of transferPackage.data.participants) {
      ensureParticipant(participant, participantIds, added, skipped);
    }

    for (const participation of transferPackage.data.participations) {
      const eventId = ensureEvent(
        participation.event,
        dictionaryIds,
        eventIds,
        added,
        skipped,
      );
      const participantId = ensureParticipant(
        participation.participant,
        participantIds,
        added,
        skipped,
      );
      const supervisorId = participation.supervisor
        ? ensureParticipant(participation.supervisor, participantIds, added, skipped)
        : null;
      const resultId = dictionaryIds.get(
        dictionaryKey('participation_result', participation.resultCode),
      );

      if (!resultId) {
        throw new Error(`Не найден результат участия: ${participation.resultCode}.`);
      }

      const duplicateId = findParticipationId(
        eventId,
        participantId,
        supervisorId,
        resultId,
      );

      if (duplicateId !== null) {
        skipped.participations += 1;
        if (participation.certificate) {
          skipped.certificates += 1;
        }
        continue;
      }

      const certificateImageName = await writeCertificate(participation.certificate);

      if (certificateImageName) {
        added.certificates += 1;
      }

      insertParticipation(
        participation,
        eventId,
        participantId,
        supervisorId,
        resultId,
        certificateImageName,
      );
      added.participations += 1;
    }

    getDb().exec('COMMIT');
  } catch (error) {
    getDb().exec('ROLLBACK');
    throw error;
  }

  return {
    added,
    skipped,
  };
}

export async function exportDataForAdmin(
  webContentsId: number,
  window: BrowserWindow,
): Promise<DataExportResult | null> {
  requireAdminSession(webContentsId);

  const transferPackage = await buildTransferPackage();
  const fileName = `uchet-dostizheniy-export-${createTimestamp()}.srdata`;
  const saveDialog = await dialog.showSaveDialog(window, {
    title: 'Экспортировать данные',
    defaultPath: join(app.getPath('documents'), fileName),
    filters: [
      {
        name: 'Файл переноса данных',
        extensions: ['srdata'],
      },
    ],
  });

  if (saveDialog.canceled || !saveDialog.filePath) {
    return null;
  }

  await writeFile(
    saveDialog.filePath,
    JSON.stringify(transferPackage, null, 2),
    'utf8',
  );

  return {
    filePath: saveDialog.filePath,
    dictionaryCount: transferPackage.data.dictionaries.length,
    eventCount: transferPackage.data.events.length,
    participantCount: transferPackage.data.participants.length,
    participationCount: transferPackage.data.participations.length,
    certificateCount: transferPackage.data.participations.filter(
      (participation) => participation.certificate,
    ).length,
  };
}

export async function importDataForAdmin(
  webContentsId: number,
  window: BrowserWindow,
): Promise<DataImportResult | null> {
  requireAdminSession(webContentsId);

  const openDialog = await dialog.showOpenDialog(window, {
    title: 'Импортировать данные',
    properties: ['openFile'],
    filters: [
      {
        name: 'Файл переноса данных',
        extensions: ['srdata', 'json'],
      },
    ],
  });

  if (openDialog.canceled || openDialog.filePaths.length === 0) {
    return null;
  }

  const confirmation = await dialog.showMessageBox(window, {
    type: 'warning',
    buttons: ['Импортировать', 'Отмена'],
    defaultId: 0,
    cancelId: 1,
    title: 'Импорт данных',
    message: 'Импорт добавит новые записи и не удалит существующие данные.',
    detail:
      'Перед импортом будет создана резервная копия текущей базы. Дубли будут пропущены.',
  });

  if (confirmation.response !== 0) {
    return null;
  }

  const filePath = openDialog.filePaths[0];
  const rawJson = await readFile(filePath, 'utf8');
  const transferPackage = parseTransferPackage(rawJson);
  const backupFilePath = await createImportBackup();
  const result = await importPackage(transferPackage);

  return {
    filePath,
    backupFilePath,
    ...result,
  };
}
