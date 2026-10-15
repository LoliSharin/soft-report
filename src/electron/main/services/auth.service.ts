import type { AuthSession, LoginInput } from '../../../shared/auth.types';

import { findUserByUsername } from '../repositories/user.repository';

import { hashPassword, verifyPassword } from './password.service';
import { clearSession, getSession, setSession } from './session.service';
import { assertNonEmptyString } from './validation.service';

export function login(webContentsId: number, input: LoginInput): AuthSession {
  const username = assertNonEmptyString(input.username, '\u041b\u043e\u0433\u0438\u043d');
  const password = assertNonEmptyString(input.password, '\u041f\u0430\u0440\u043e\u043b\u044c');
  const user = findUserByUsername(username);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new Error(
      '\u041d\u0435\u0432\u0435\u0440\u043d\u044b\u0439 \u043b\u043e\u0433\u0438\u043d \u0438\u043b\u0438 \u043f\u0430\u0440\u043e\u043b\u044c.',
    );
  }

  if (!user.isActive) {
    throw new Error(
      '\u0412\u044b\u0431\u0440\u0430\u043d\u043d\u044b\u0439 \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044c \u0434\u0435\u0430\u043a\u0442\u0438\u0432\u0438\u0440\u043e\u0432\u0430\u043d.',
    );
  }

  const session: AuthSession = {
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
  };

  setSession(webContentsId, session);

  return session;
}

export function logout(webContentsId: number): void {
  clearSession(webContentsId);
}

export function getCurrentSession(webContentsId: number): AuthSession | null {
  return getSession(webContentsId);
}

export function createPasswordHash(password: string): string {
  const normalized = assertNonEmptyString(password, '\u041f\u0430\u0440\u043e\u043b\u044c');

  if (normalized.length < 6) {
    throw new Error(
      '\u041f\u0430\u0440\u043e\u043b\u044c \u0434\u043e\u043b\u0436\u0435\u043d \u0441\u043e\u0434\u0435\u0440\u0436\u0430\u0442\u044c \u043c\u0438\u043d\u0438\u043c\u0443\u043c 6 \u0441\u0438\u043c\u0432\u043e\u043b\u043e\u0432.',
    );
  }

  return hashPassword(normalized);
}
