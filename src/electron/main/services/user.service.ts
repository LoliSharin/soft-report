import type { UserInput, UserRecord } from '../../../shared/auth.types';

import {
  countActiveAdmins,
  createUser,
  deleteUser,
  findUserByUsername,
  getStoredUserById,
  listUsers,
  updateUser,
} from '../repositories/user.repository';

import { createPasswordHash } from './auth.service';
import { requireAdminSession } from './session.service';
import {
  assertNonEmptyString,
  assertUserRole,
} from './validation.service';

function normalizeUserInput(input: UserInput): UserInput {
  return {
    username: assertNonEmptyString(input.username, '\u041b\u043e\u0433\u0438\u043d'),
    fullName: assertNonEmptyString(input.fullName, '\u0424\u0418\u041e'),
    role: assertUserRole(input.role),
    isActive: Boolean(input.isActive),
    password: input.password?.trim() || undefined,
  };
}

function ensureUsernameIsAvailable(username: string, currentUserId?: number): void {
  const existing = findUserByUsername(username);

  if (existing && existing.id !== currentUserId) {
    throw new Error('\u041b\u043e\u0433\u0438\u043d \u0443\u0436\u0435 \u0437\u0430\u043d\u044f\u0442.');
  }
}

export function listUsersForAdmin(webContentsId: number): UserRecord[] {
  requireAdminSession(webContentsId);

  return listUsers();
}

export function createUserForAdmin(
  webContentsId: number,
  input: UserInput,
): UserRecord {
  requireAdminSession(webContentsId);

  const normalized = normalizeUserInput(input);

  if (!normalized.password) {
    throw new Error(
      '\u041f\u0430\u0440\u043e\u043b\u044c \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u0435\u043d \u0434\u043b\u044f \u043d\u043e\u0432\u043e\u0433\u043e \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f.',
    );
  }

  ensureUsernameIsAvailable(normalized.username);

  return createUser(normalized, createPasswordHash(normalized.password));
}

export function updateUserForAdmin(
  webContentsId: number,
  id: number,
  input: UserInput,
): UserRecord {
  const session = requireAdminSession(webContentsId);
  const current = getStoredUserById(id);

  if (!current) {
    throw new Error(
      '\u041f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044c \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d.',
    );
  }

  const normalized = normalizeUserInput(input);
  ensureUsernameIsAvailable(normalized.username, id);

  if (current.role === 'admin' && countActiveAdmins() <= 1) {
    const adminWillBeDisabled =
      normalized.role !== 'admin' || normalized.isActive === false;

    if (adminWillBeDisabled) {
      throw new Error(
        '\u0414\u043e\u043b\u0436\u0435\u043d \u043e\u0441\u0442\u0430\u0442\u044c\u0441\u044f \u043a\u0430\u043a \u043c\u0438\u043d\u0438\u043c\u0443\u043c \u043e\u0434\u0438\u043d \u0430\u043a\u0442\u0438\u0432\u043d\u044b\u0439 \u0430\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440.',
      );
    }
  }

  if (session.user.id === id && normalized.isActive === false) {
    throw new Error(
      '\u041d\u0435\u043b\u044c\u0437\u044f \u0434\u0435\u0430\u043a\u0442\u0438\u0432\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0442\u0435\u043a\u0443\u0449\u0443\u044e \u0443\u0447\u0435\u0442\u043d\u0443\u044e \u0437\u0430\u043f\u0438\u0441\u044c \u0430\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440\u0430.',
    );
  }

  return updateUser(
    id,
    normalized,
    normalized.password ? createPasswordHash(normalized.password) : undefined,
  );
}

export function deleteUserForAdmin(webContentsId: number, id: number): void {
  const session = requireAdminSession(webContentsId);
  const current = getStoredUserById(id);

  if (!current) {
    throw new Error(
      '\u041f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044c \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d.',
    );
  }

  if (session.user.id === id) {
    throw new Error(
      '\u041d\u0435\u043b\u044c\u0437\u044f \u0443\u0434\u0430\u043b\u0438\u0442\u044c \u0442\u0435\u043a\u0443\u0449\u0435\u0433\u043e \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f.',
    );
  }

  if (current.role === 'admin' && countActiveAdmins() <= 1) {
    throw new Error(
      '\u0414\u043e\u043b\u0436\u0435\u043d \u043e\u0441\u0442\u0430\u0442\u044c\u0441\u044f \u043a\u0430\u043a \u043c\u0438\u043d\u0438\u043c\u0443\u043c \u043e\u0434\u0438\u043d \u0430\u043a\u0442\u0438\u0432\u043d\u044b\u0439 \u0430\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440.',
    );
  }

  deleteUser(id);
}
