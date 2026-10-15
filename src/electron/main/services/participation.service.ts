import type {
  ParticipationCertificatePreview,
  ParticipationCertificateSelection,
  ParticipationInput,
  ParticipationRecord,
} from '../../../shared/participation.types';

import type { BrowserWindow } from 'electron';

import { getDictionaryById } from '../repositories/dictionary.repository';
import { getEventById } from '../repositories/event.repository';
import { getParticipantById } from '../repositories/participant.repository';
import {
  createParticipation,
  deleteParticipation,
  getParticipationById,
  listParticipations,
  updateParticipation,
} from '../repositories/participation.repository';

import {
  deleteStoredParticipationCertificate,
  downloadStoredParticipationCertificate,
  getStoredParticipationCertificatePreview,
  openStoredParticipationCertificate,
  selectParticipationCertificateImage,
  storeParticipationCertificate,
} from './participation-certificate.service';
import { requireSession } from './session.service';
import {
  assertPositiveInteger,
  normalizeOptionalString,
} from './validation.service';

function normalizeParticipationInput(
  input: ParticipationInput,
): ParticipationInput {
  return {
    eventId: assertPositiveInteger(Number(input.eventId), '\u041c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u0435'),
    participantId: assertPositiveInteger(Number(input.participantId), '\u0423\u0447\u0430\u0441\u0442\u043d\u0438\u043a'),
    supervisorId:
      input.supervisorId === undefined || input.supervisorId === null
        ? null
        : assertPositiveInteger(Number(input.supervisorId), '\u0420\u0443\u043a\u043e\u0432\u043e\u0434\u0438\u0442\u0435\u043b\u044c'),
    resultId: assertPositiveInteger(Number(input.resultId), '\u0420\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442'),
    notes: normalizeOptionalString(input.notes),
    certificateSourcePath: normalizeOptionalString(input.certificateSourcePath),
    clearCertificateImage: Boolean(input.clearCertificateImage),
  };
}

function validateRelations(input: ParticipationInput): void {
  const event = getEventById(input.eventId);

  if (!event) {
    throw new Error(
      '\u0412\u044b\u0431\u0440\u0430\u043d\u043d\u043e\u0435 \u043c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u0435 \u043d\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442.',
    );
  }

  const participant = getParticipantById(input.participantId);

  if (!participant) {
    throw new Error(
      '\u0412\u044b\u0431\u0440\u0430\u043d\u043d\u044b\u0439 \u0443\u0447\u0430\u0441\u0442\u043d\u0438\u043a \u043d\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442.',
    );
  }

  const result = getDictionaryById(input.resultId);

  if (!result || result.type !== 'participation_result') {
    throw new Error(
      '\u0412\u044b\u0431\u0440\u0430\u043d\u043d\u044b\u0439 \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442 \u043d\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442.',
    );
  }

  if (participant.participantType === 'student') {
    if (!input.supervisorId) {
      throw new Error(
        '\u0414\u043b\u044f \u0443\u0447\u0430\u0441\u0442\u0438\u044f \u0441\u0442\u0443\u0434\u0435\u043d\u0442\u0430 \u0440\u0443\u043a\u043e\u0432\u043e\u0434\u0438\u0442\u0435\u043b\u044c \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u0435\u043d.',
      );
    }

    const supervisor = getParticipantById(input.supervisorId);

    if (!supervisor || supervisor.participantType !== 'teacher') {
      throw new Error(
        '\u0420\u0443\u043a\u043e\u0432\u043e\u0434\u0438\u0442\u0435\u043b\u044c \u0434\u043e\u043b\u0436\u0435\u043d \u0431\u044b\u0442\u044c \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u044e\u0449\u0438\u043c \u043f\u0440\u0435\u043f\u043e\u0434\u0430\u0432\u0430\u0442\u0435\u043b\u0435\u043c.',
      );
    }

    if (supervisor.id === participant.id) {
      throw new Error(
        '\u0423\u0447\u0430\u0441\u0442\u043d\u0438\u043a \u0438 \u0440\u0443\u043a\u043e\u0432\u043e\u0434\u0438\u0442\u0435\u043b\u044c \u043d\u0435 \u043c\u043e\u0433\u0443\u0442 \u0441\u043e\u0432\u043f\u0430\u0434\u0430\u0442\u044c.',
      );
    }
  }
}

export function listParticipationsForUser(
  webContentsId: number,
): ParticipationRecord[] {
  requireSession(webContentsId);

  return listParticipations();
}

export async function createParticipationForUser(
  webContentsId: number,
  input: ParticipationInput,
): Promise<ParticipationRecord> {
  requireSession(webContentsId);

  const normalized = normalizeParticipationInput(input);
  validateRelations(normalized);
  let storedCertificateImageName: string | null = null;

  try {
    if (normalized.certificateSourcePath) {
      storedCertificateImageName = await storeParticipationCertificate(
        normalized.certificateSourcePath,
      );
    }

    return createParticipation({
      eventId: normalized.eventId,
      participantId: normalized.participantId,
      supervisorId: normalized.supervisorId,
      resultId: normalized.resultId,
      notes: normalized.notes,
      certificateImageName: storedCertificateImageName,
    });
  } catch (error) {
    await deleteStoredParticipationCertificate(storedCertificateImageName);
    throw error;
  }
}

export async function updateParticipationForUser(
  webContentsId: number,
  id: number,
  input: ParticipationInput,
): Promise<ParticipationRecord> {
  requireSession(webContentsId);

  const normalized = normalizeParticipationInput(input);
  validateRelations(normalized);
  const current = getParticipationById(id);

  if (!current) {
    throw new Error(
      '\u0417\u0430\u043f\u0438\u0441\u044c \u0443\u0447\u0430\u0441\u0442\u0438\u044f \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u0430.',
    );
  }

  let storedCertificateImageName: string | null =
    current.certificateImageName ?? null;
  let newCertificateImageName: string | null = null;

  try {
    if (normalized.clearCertificateImage) {
      storedCertificateImageName = null;
    }

    if (normalized.certificateSourcePath) {
      newCertificateImageName = await storeParticipationCertificate(
        normalized.certificateSourcePath,
      );
      storedCertificateImageName = newCertificateImageName;
    }

    const updated = updateParticipation(id, {
      eventId: normalized.eventId,
      participantId: normalized.participantId,
      supervisorId: normalized.supervisorId,
      resultId: normalized.resultId,
      notes: normalized.notes,
      certificateImageName: storedCertificateImageName,
    });

    if (
      current.certificateImageName &&
      current.certificateImageName !== storedCertificateImageName
    ) {
      await deleteStoredParticipationCertificate(current.certificateImageName);
    }

    return updated;
  } catch (error) {
    if (newCertificateImageName) {
      await deleteStoredParticipationCertificate(newCertificateImageName);
    }

    throw error;
  }
}

export async function deleteParticipationForUser(
  webContentsId: number,
  id: number,
): Promise<void> {
  requireSession(webContentsId);
  const current = getParticipationById(id);
  deleteParticipation(id);

  await deleteStoredParticipationCertificate(current?.certificateImageName);
}

export function selectParticipationCertificateForUser(
  webContentsId: number,
  window: BrowserWindow,
): Promise<ParticipationCertificateSelection | null> {
  requireSession(webContentsId);

  return selectParticipationCertificateImage(window);
}

export async function getParticipationCertificatePreviewForUser(
  webContentsId: number,
  id: number,
): Promise<ParticipationCertificatePreview> {
  requireSession(webContentsId);

  const record = getParticipationById(id);

  if (!record) {
    throw new Error(
      '\u0417\u0430\u043f\u0438\u0441\u044c \u0443\u0447\u0430\u0441\u0442\u0438\u044f \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u0430.',
    );
  }

  if (!record.certificateImageName) {
    throw new Error(
      '\u0424\u043e\u0442\u043e \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043a\u0430\u0442\u0430 \u0435\u0449\u0435 \u043d\u0435 \u043f\u0440\u0438\u043a\u0440\u0435\u043f\u043b\u0435\u043d\u043e.',
    );
  }

  return getStoredParticipationCertificatePreview(record.certificateImageName);
}

export async function downloadParticipationCertificateForUser(
  webContentsId: number,
  id: number,
  window: BrowserWindow,
): Promise<string | null> {
  requireSession(webContentsId);

  const record = getParticipationById(id);

  if (!record) {
    throw new Error(
      '\u0417\u0430\u043f\u0438\u0441\u044c \u0443\u0447\u0430\u0441\u0442\u0438\u044f \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u0430.',
    );
  }

  if (!record.certificateImageName) {
    throw new Error(
      '\u0424\u043e\u0442\u043e \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043a\u0430\u0442\u0430 \u0435\u0449\u0435 \u043d\u0435 \u043f\u0440\u0438\u043a\u0440\u0435\u043f\u043b\u0435\u043d\u043e.',
    );
  }

  return downloadStoredParticipationCertificate(
    record.certificateImageName,
    window,
  );
}

export async function openParticipationCertificateForUser(
  webContentsId: number,
  id: number,
): Promise<void> {
  requireSession(webContentsId);

  const record = getParticipationById(id);

  if (!record) {
    throw new Error(
      '\u0417\u0430\u043f\u0438\u0441\u044c \u0443\u0447\u0430\u0441\u0442\u0438\u044f \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u0430.',
    );
  }

  if (!record.certificateImageName) {
    throw new Error(
      '\u0424\u043e\u0442\u043e \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043a\u0430\u0442\u0430 \u0435\u0449\u0435 \u043d\u0435 \u043f\u0440\u0438\u043a\u0440\u0435\u043f\u043b\u0435\u043d\u043e.',
    );
  }

  await openStoredParticipationCertificate(record.certificateImageName);
}
