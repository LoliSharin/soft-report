import type {
  ParticipantInput,
  ParticipantRecord,
} from '../../../shared/participant.types';

import {
  createParticipant,
  deleteParticipant,
  listParticipants,
  updateParticipant,
} from '../repositories/participant.repository';

import { requireSession } from './session.service';
import {
  assertNonEmptyString,
  assertParticipantType,
  normalizeOptionalString,
} from './validation.service';

function normalizeParticipantInput(input: ParticipantInput): ParticipantInput {
  const participantType = assertParticipantType(input.participantType);
  const groupName = normalizeOptionalString(input.groupName);
  const positionOrSubject = normalizeOptionalString(input.positionOrSubject);

  if (participantType === 'student' && !groupName) {
    throw new Error(
      '\u0414\u043b\u044f \u0441\u0442\u0443\u0434\u0435\u043d\u0442\u0430 \u0433\u0440\u0443\u043f\u043f\u0430 \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u0430.',
    );
  }

  if (participantType === 'teacher' && !positionOrSubject) {
    throw new Error(
      '\u0414\u043b\u044f \u043f\u0440\u0435\u043f\u043e\u0434\u0430\u0432\u0430\u0442\u0435\u043b\u044f \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u0430 \u0434\u043e\u043b\u0436\u043d\u043e\u0441\u0442\u044c \u0438\u043b\u0438 \u043f\u0440\u0435\u0434\u043c\u0435\u0442.',
    );
  }

  return {
    fullName: assertNonEmptyString(input.fullName, '\u0424\u0418\u041e'),
    participantType,
    groupName,
    positionOrSubject,
  };
}

export function listParticipantsForUser(
  webContentsId: number,
): ParticipantRecord[] {
  requireSession(webContentsId);

  return listParticipants();
}

export function createParticipantForUser(
  webContentsId: number,
  input: ParticipantInput,
): ParticipantRecord {
  requireSession(webContentsId);

  return createParticipant(normalizeParticipantInput(input));
}

export function updateParticipantForUser(
  webContentsId: number,
  id: number,
  input: ParticipantInput,
): ParticipantRecord {
  requireSession(webContentsId);

  return updateParticipant(id, normalizeParticipantInput(input));
}

export function deleteParticipantForUser(
  webContentsId: number,
  id: number,
): void {
  requireSession(webContentsId);
  deleteParticipant(id);
}
