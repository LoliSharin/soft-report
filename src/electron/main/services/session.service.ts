import type { AuthSession } from '../../../shared/auth.types';

const sessions = new Map<number, AuthSession>();

export function setSession(webContentsId: number, session: AuthSession): void {
  sessions.set(webContentsId, session);
}

export function getSession(webContentsId: number): AuthSession | null {
  return sessions.get(webContentsId) ?? null;
}

export function clearSession(webContentsId: number): void {
  sessions.delete(webContentsId);
}

export function requireSession(webContentsId: number): AuthSession {
  const session = getSession(webContentsId);

  if (!session) {
    throw new Error(
      '\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u0432\u044b\u043f\u043e\u043b\u043d\u0438\u0442\u0435 \u0432\u0445\u043e\u0434.',
    );
  }

  return session;
}

export function requireAdminSession(webContentsId: number): AuthSession {
  const session = requireSession(webContentsId);

  if (session.user.role !== 'admin') {
    throw new Error(
      '\u0414\u043b\u044f \u044d\u0442\u043e\u0433\u043e \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f \u043d\u0443\u0436\u043d\u044b \u043f\u0440\u0430\u0432\u0430 \u0430\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440\u0430.',
    );
  }

  return session;
}
