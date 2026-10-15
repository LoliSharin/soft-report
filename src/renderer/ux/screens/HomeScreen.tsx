import type { DesktopApi } from '../../../shared/desktop.types';

interface HomeScreenProps {
  desktopApi: DesktopApi;
  onGoToAbout: () => void;
}

export function HomeScreen({ desktopApi, onGoToAbout }: HomeScreenProps) {
  return (
    <main className="screen-card">
      <header className="screen-card__header">
        <div>
          <p className="screen-card__eyebrow">
            {'\u0414\u0435\u043c\u043e\u043d\u0441\u0442\u0440\u0430\u0446\u0438\u044f'}
          </p>
          <h2 className="screen-card__title">
            {'\u0411\u0430\u0437\u043e\u0432\u044b\u0439 \u044d\u043a\u0440\u0430\u043d'}
          </h2>
        </div>
        <button className="button button--primary" onClick={onGoToAbout} type="button">
          {'\u041f\u0435\u0440\u0435\u0439\u0442\u0438 \u043d\u0430 \u0434\u0440\u0443\u0433\u043e\u0439 \u044d\u043a\u0440\u0430\u043d'}
        </button>
      </header>

      <div className="report-grid">
        <article className="report-card">
          <h3>{'\u041f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u0438\u0435'}</h3>
          <p>{desktopApi.appName}</p>
        </article>
        <article className="report-card">
          <h3>{'\u041f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0430'}</h3>
          <p>{desktopApi.platform}</p>
        </article>
        <article className="report-card">
          <h3>Electron</h3>
          <p>{desktopApi.versions.electron}</p>
        </article>
        <article className="report-card">
          <h3>Node.js</h3>
          <p>{desktopApi.versions.node}</p>
        </article>
      </div>
    </main>
  );
}
