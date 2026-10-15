import type { DictionaryType } from '../../../shared/dictionary.types';
import type { UserRole } from '../../../shared/auth.types';
import type { ParticipantType } from '../../../shared/participant.types';

const DICTIONARY_TYPES: DictionaryType[] = [
  'event_level',
  'participation_result',
];
const USER_ROLES: UserRole[] = ['admin', 'user'];
const PARTICIPANT_TYPES: ParticipantType[] = ['teacher', 'student'];

export function assertNonEmptyString(value: string, fieldName: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`\u041f\u043e\u043b\u0435 \u00ab${fieldName}\u00bb \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u043e.`);
  }

  return normalized;
}

export function normalizeOptionalString(value?: string | null): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = value.trim();

  return normalized || null;
}

export function assertValidDate(value: string, fieldName: string): string {
  const normalized = value.trim();
  const parsedDate = new Date(normalized);

  if (!normalized || Number.isNaN(parsedDate.getTime())) {
    throw new Error(
      `\u041f\u043e\u043b\u0435 \u00ab${fieldName}\u00bb \u0434\u043e\u043b\u0436\u043d\u043e \u0441\u043e\u0434\u0435\u0440\u0436\u0430\u0442\u044c \u043a\u043e\u0440\u0440\u0435\u043a\u0442\u043d\u0443\u044e \u0434\u0430\u0442\u0443.`,
    );
  }

  return normalized;
}

export function assertUserRole(value: string): UserRole {
  if (!USER_ROLES.includes(value as UserRole)) {
    throw new Error(
      '\u041d\u0435\u0434\u043e\u043f\u0443\u0441\u0442\u0438\u043c\u0430\u044f \u0440\u043e\u043b\u044c \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f.',
    );
  }

  return value as UserRole;
}

export function assertDictionaryType(value: string): DictionaryType {
  if (!DICTIONARY_TYPES.includes(value as DictionaryType)) {
    throw new Error(
      '\u041d\u0435\u0434\u043e\u043f\u0443\u0441\u0442\u0438\u043c\u044b\u0439 \u0442\u0438\u043f \u0441\u043f\u0440\u0430\u0432\u043e\u0447\u043d\u0438\u043a\u0430.',
    );
  }

  return value as DictionaryType;
}

export function assertParticipantType(value: string): ParticipantType {
  if (!PARTICIPANT_TYPES.includes(value as ParticipantType)) {
    throw new Error(
      '\u041d\u0435\u0434\u043e\u043f\u0443\u0441\u0442\u0438\u043c\u044b\u0439 \u0442\u0438\u043f \u0443\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u0430.',
    );
  }

  return value as ParticipantType;
}

export function assertPositiveInteger(value: number, fieldName: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(
      `\u041f\u043e\u043b\u0435 \u00ab${fieldName}\u00bb \u0434\u043e\u043b\u0436\u043d\u043e \u0431\u044b\u0442\u044c \u043f\u043e\u043b\u043e\u0436\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u043c \u0446\u0435\u043b\u044b\u043c \u0447\u0438\u0441\u043b\u043e\u043c.`,
    );
  }

  return value;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
