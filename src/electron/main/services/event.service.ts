import type { EventInput, EventRecord } from '../../../shared/event.types';
import { getDictionaryById } from '../repositories/dictionary.repository';
import {
  createEvent,
  deleteEvent,
  listEvents,
  updateEvent,
} from '../repositories/event.repository';
import { requireSession } from './session.service';
import {
  assertNonEmptyString,
  assertPositiveInteger,
  assertValidDate,
} from './validation.service';

function normalizeEventInput(input: EventInput): EventInput {
  return {
    levelId: assertPositiveInteger(Number(input.levelId), '\u0423\u0440\u043e\u0432\u0435\u043d\u044c'),
    eventDate: assertValidDate(input.eventDate, '\u0414\u0430\u0442\u0430 \u043f\u0440\u043e\u0432\u0435\u0434\u0435\u043d\u0438\u044f'),
    location: assertNonEmptyString(input.location, '\u041c\u0435\u0441\u0442\u043e \u043f\u0440\u043e\u0432\u0435\u0434\u0435\u043d\u0438\u044f'),
    title: assertNonEmptyString(input.title, '\u041d\u0430\u0438\u043c\u0435\u043d\u043e\u0432\u0430\u043d\u0438\u0435 \u043c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u044f'),
  };
}

function ensureLevelExists(levelId: number): void {
  const dictionary = getDictionaryById(levelId);

  if (!dictionary || dictionary.type !== 'event_level') {
    throw new Error(
      '\u0412\u044b\u0431\u0440\u0430\u043d\u043d\u044b\u0439 \u0443\u0440\u043e\u0432\u0435\u043d\u044c \u043c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u044f \u043d\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442.',
    );
  }
}

export function listEventsForUser(webContentsId: number): EventRecord[] {
  requireSession(webContentsId);

  return listEvents();
}

export function createEventForUser(
  webContentsId: number,
  input: EventInput,
): EventRecord {
  requireSession(webContentsId);

  const normalized = normalizeEventInput(input);
  ensureLevelExists(normalized.levelId);

  return createEvent(normalized);
}

export function updateEventForUser(
  webContentsId: number,
  id: number,
  input: EventInput,
): EventRecord {
  requireSession(webContentsId);

  const normalized = normalizeEventInput(input);
  ensureLevelExists(normalized.levelId);

  return updateEvent(id, normalized);
}

export function deleteEventForUser(webContentsId: number, id: number): void {
  requireSession(webContentsId);
  deleteEvent(id);
}
