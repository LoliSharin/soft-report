import type { DesktopApi } from '../../../shared/desktop.types';

import { MetricCard } from '../components/MetricCard';

interface HomeScreenProps {
  desktopApi: DesktopApi;
}

export function HomeScreen({ desktopApi }: HomeScreenProps) {
  return (
    <main className="home-screen">
      <section className="hero-panel">
        <p className="hero-panel__eyebrow">Electron + React</p>
        <h1 className="hero-panel__title">Desktop workspace ready for React UI.</h1>
        <p className="hero-panel__description">
          Renderer now uses React, while Electron main and preload stay isolated
          in dedicated folders. You can build screens, flows, and state
          management on top of this structure.
        </p>

        <div className="hero-panel__grid">
          <MetricCard label="Application" value={desktopApi.appName} />
          <MetricCard label="Platform" value={desktopApi.platform} />
          <MetricCard label="Electron" value={desktopApi.versions.electron} />
          <MetricCard label="Node.js" value={desktopApi.versions.node} />
        </div>
      </section>
    </main>
  );
}
