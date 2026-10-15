import { useEffect, useState } from 'react';

import type { AuthSession } from '../../shared/auth.types';

import { getDesktopApi } from '../logic/get-desktop-api';

import { AppShell } from './AppShell';
import { LoginScreen } from './LoginScreen';

const api = getDesktopApi();

export function App() {
  const [session, setSession] = useState<AuthSession | null | undefined>(
    undefined,
  );

  useEffect(() => {
    document.title = api.appName;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession(): Promise<void> {
      try {
        const currentSession = await api.auth.getSession();

        if (!cancelled) {
          setSession(currentSession);
        }
      } catch {
        if (!cancelled) {
          setSession(null);
        }
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  if (session === undefined) {
    return (
      <main className="loading-screen">
        <div className="loading-screen__card">
          {'\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u0440\u0430\u0431\u043e\u0447\u0435\u0433\u043e \u043f\u0440\u043e\u0441\u0442\u0440\u0430\u043d\u0441\u0442\u0432\u0430...'}
        </div>
      </main>
    );
  }

  if (!session) {
    return <LoginScreen api={api} onLoginSuccess={setSession} />;
  }

  return <AppShell api={api} onSessionChange={setSession} session={session} />;
}
