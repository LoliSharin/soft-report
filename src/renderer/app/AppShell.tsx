import { useEffect, useState } from 'react';

import type { AuthSession } from '../../shared/auth.types';
import type { DesktopApi } from '../../shared/desktop.types';

import { getErrorMessage } from '../logic/get-error-message';
import { AdminScreen } from '../ux/screens/AdminScreen';
import { EventsScreen } from '../ux/screens/EventsScreen';
import { ParticipantsScreen } from '../ux/screens/ParticipantsScreen';
import { ParticipationsScreen } from '../ux/screens/ParticipationsScreen';
import { ReportsScreen } from '../ux/screens/ReportsScreen';

import { Sidebar } from './Sidebar';
import type { AppNotice, AppScreen, NoticeTone } from './screen.types';

interface AppShellProps {
  api: DesktopApi;
  session: AuthSession;
  onSessionChange: (session: AuthSession | null) => void;
}

export function AppShell({
  api,
  session,
  onSessionChange,
}: AppShellProps) {
  const [activeScreen, setActiveScreen] = useState<AppScreen>('events');
  const [notice, setNotice] = useState<AppNotice | null>(null);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }
    const timer = window.setTimeout(() => setNotice(null), 4000);

    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (activeScreen === 'admin' && session.user.role !== 'admin') {
      setActiveScreen('events');
    }
  }, [activeScreen, session.user.role]);

  function notify(tone: NoticeTone, text: string): void {
    setNotice({ tone, text });
  }

  async function handleLogout(): Promise<void> {
    try {
      await api.auth.logout();
      onSessionChange(null);
    } catch (logoutError) {
      notify(
        'error',
        getErrorMessage(
          logoutError,
          '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0432\u044b\u0439\u0442\u0438 \u0438\u0437 \u0441\u0438\u0441\u0442\u0435\u043c\u044b.',
        ),
      );
    }
  }

  const sidebarItems: Array<{ id: AppScreen; label: string }> = [
    {
      id: 'events' as AppScreen,
      label: '\u041c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u044f',
    },
    {
      id: 'participants' as AppScreen,
      label: '\u0423\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u0438',
    },
    {
      id: 'participations' as AppScreen,
      label: '\u0423\u0447\u0430\u0441\u0442\u0438\u0435',
    },
    {
      id: 'reports' as AppScreen,
      label: '\u041e\u0442\u0447\u0435\u0442\u044b',
    },
    ...(session.user.role === 'admin'
      ? [
          {
            id: 'admin' as AppScreen,
            label:
              '\u0410\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435',
          },
        ]
      : []),
  ];

  const screenProps = {
    api,
    session,
    notify,
  };

  let screenContent = <EventsScreen {...screenProps} />;

  if (activeScreen === 'participants') {
    screenContent = <ParticipantsScreen {...screenProps} />;
  } else if (activeScreen === 'participations') {
    screenContent = <ParticipationsScreen {...screenProps} />;
  } else if (activeScreen === 'reports') {
    screenContent = <ReportsScreen {...screenProps} />;
  } else if (activeScreen === 'admin') {
    screenContent = <AdminScreen {...screenProps} />;
  }

  return (
    <div className="app-shell">
      <Sidebar
        items={sidebarItems}
        activeItem={activeScreen}
        onSelect={setActiveScreen}
      />

      <div className="app-shell__content">
        <header className="topbar">
          <div>
            <h1 className="topbar__title">{session.user.fullName}</h1>
          </div>

          <div className="topbar__actions">
            <span className="role-pill">
              {session.user.role === 'admin'
                ? '\u0410\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440'
                : '\u041c\u0435\u0442\u043e\u0434\u0438\u0441\u0442'}
            </span>
            <button className="button button--ghost" onClick={handleLogout} type="button">
              {'\u0412\u044b\u0439\u0442\u0438'}
            </button>
          </div>
        </header>

        {notice ? (
          <div
            className={
              notice.tone === 'success'
                ? 'notice notice--success'
                : 'notice notice--error'
            }
          >
            {notice.text}
          </div>
        ) : null}

        <div className="screen-container">{screenContent}</div>
      </div>
    </div>
  );
}
