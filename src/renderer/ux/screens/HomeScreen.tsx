import type { DesktopApi } from '../../../shared/desktop.types';

import { MetricCard } from '../components/MetricCard';
import { NotesPanel } from '../components/NotesPanel';

interface HomeScreenProps {
  desktopApi: DesktopApi;
  onGoToAbout: () => void;
}

export function HomeScreen({ desktopApi, onGoToAbout }: HomeScreenProps) {
  return (
    <main className="home-screen">
      <section className="hero-panel">
        <p className="hero-panel__eyebrow">Electron + React + SQLite</p>
        <h1 className="hero-panel__title">Desktop workspace with local data.</h1>
        <p className="hero-panel__description">
          Renderer uses React, Electron runs the local SQLite database in the
          main process, and preload exposes only the methods that the UI needs.
        </p>
        <button className="primary-button" onClick={onGoToAbout}>
          Перейти на другую страницу
        </button>

        <div className="hero-panel__grid">
          <MetricCard label="Application" value={desktopApi.appName} />
          <MetricCard label="Platform" value={desktopApi.platform} />
          <MetricCard label="Electron" value={desktopApi.versions.electron} />
          <MetricCard label="Node.js" value={desktopApi.versions.node} />
        </div>

        <NotesPanel desktopApi={desktopApi} />
      </section>
    </main>
  );
}
