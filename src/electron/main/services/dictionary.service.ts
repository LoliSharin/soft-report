import type {
  DictionaryInput,
  DictionaryRecord,
  DictionaryType,
} from '../../../shared/dictionary.types';

import {
  createDictionary,
  deleteDictionary,
  getDictionaryById,
  listDictionaries,
  updateDictionary,
} from '../repositories/dictionary.repository';

import { requireAdminSession, requireSession } from './session.service';
import {
  assertDictionaryType,
  assertNonEmptyString,
  slugify,
} from './validation.service';

function normalizeDictionaryInput(input: DictionaryInput): DictionaryInput {
  return {
    type: assertDictionaryType(input.type),
    label: assertNonEmptyString(input.label, 'Label'),
    sortOrder: Number.isFinite(input.sortOrder) ? Math.trunc(input.sortOrder) : 0,
    isActive: Boolean(input.isActive),
  };
}

function buildDictionaryCode(
  type: DictionaryType,
  label: string,
  currentId?: number,
): string {
  const baseCode = slugify(label) || type;
  const existingCodes = listDictionaries(type)
    .filter((item) => item.id !== currentId)
    .map((item) => item.code);

  if (!existingCodes.includes(baseCode)) {
    return baseCode;
  }

  let suffix = 2;

  while (existingCodes.includes(`${baseCode}_${suffix}`)) {
    suffix += 1;
  }

  return `${baseCode}_${suffix}`;
}

export function listDictionariesForUser(
  webContentsId: number,
  type?: DictionaryType,
): DictionaryRecord[] {
  requireSession(webContentsId);

  if (type) {
    assertDictionaryType(type);
  }

  return listDictionaries(type);
}

export function createDictionaryForAdmin(
  webContentsId: number,
  input: DictionaryInput,
): DictionaryRecord {
  requireAdminSession(webContentsId);

  const normalized = normalizeDictionaryInput(input);
  const code = buildDictionaryCode(normalized.type, normalized.label);

  return createDictionary(normalized, code);
}

export function updateDictionaryForAdmin(
  webContentsId: number,
  id: number,
  input: DictionaryInput,
): DictionaryRecord {
  requireAdminSession(webContentsId);

  const current = getDictionaryById(id);

  if (!current) {
    throw new Error('Dictionary item was not found.');
  }

  const normalized = normalizeDictionaryInput(input);

  if (current.type !== normalized.type) {
    throw new Error('Dictionary item type cannot be changed.');
  }

  return updateDictionary(id, normalized);
}

export function deleteDictionaryForAdmin(
  webContentsId: number,
  id: number,
): void {
  requireAdminSession(webContentsId);
  deleteDictionary(id);
}
