import { useState } from 'react';

import type { ScreenProps } from '../../app/screen.types';
import { BackupAdminPanel } from '../components/admin/BackupAdminPanel';
import { DictionariesAdminPanel } from '../components/admin/DictionariesAdminPanel';
import { UsersAdminPanel } from '../components/admin/UsersAdminPanel';

type AdminTab = 'users' | 'dictionaries' | 'backup';

export function AdminScreen({ api, notify, session }: ScreenProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  if (session.user.role !== 'admin') {
    return (
      <section className="screen-card">
        <header className="screen-card__header">
          <div>
            <p className="screen-card__eyebrow">
              {'\u0410\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435'}
            </p>
            <h2 className="screen-card__title">
              {'\u0414\u043e\u0441\u0442\u0443\u043f \u0437\u0430\u043f\u0440\u0435\u0449\u0435\u043d'}
            </h2>
          </div>
        </header>
        <p>
          {
            '\u0414\u043b\u044f \u0434\u043e\u0441\u0442\u0443\u043f\u0430 \u043a \u044d\u0442\u043e\u043c\u0443 \u0440\u0430\u0437\u0434\u0435\u043b\u0443 \u043d\u0443\u0436\u043d\u0430 \u0440\u043e\u043b\u044c \u0430\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440\u0430.'
          }
        </p>
      </section>
    );
  }

  let content = <UsersAdminPanel api={api} notify={notify} />;

  if (activeTab === 'dictionaries') {
    content = <DictionariesAdminPanel api={api} notify={notify} />;
  } else if (activeTab === 'backup') {
    content = <BackupAdminPanel api={api} notify={notify} />;
  }

  return (
    <section className="screen-card">
      <header className="screen-card__header">
        <div>
          <p className="screen-card__eyebrow">
            {'\u0410\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435'}
          </p>
          <h2 className="screen-card__title">
            {'\u041f\u0430\u043d\u0435\u043b\u044c \u0430\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440\u0430'}
          </h2>
        </div>
      </header>

      <div className="subnav">
        <button
          className={
            activeTab === 'users'
              ? 'subnav__link subnav__link--active'
              : 'subnav__link'
          }
          onClick={() => setActiveTab('users')}
          type="button"
        >
          {'\u041f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0438'}
        </button>
        <button
          className={
            activeTab === 'dictionaries'
              ? 'subnav__link subnav__link--active'
              : 'subnav__link'
          }
          onClick={() => setActiveTab('dictionaries')}
          type="button"
        >
          {'\u0421\u043f\u0440\u0430\u0432\u043e\u0447\u043d\u0438\u043a\u0438'}
        </button>
        <button
          className={
            activeTab === 'backup'
              ? 'subnav__link subnav__link--active'
              : 'subnav__link'
          }
          onClick={() => setActiveTab('backup')}
          type="button"
        >
          {'\u0420\u0435\u0437\u0435\u0440\u0432\u043d\u043e\u0435 \u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435'}
        </button>
      </div>

      {content}
    </section>
  );
}
