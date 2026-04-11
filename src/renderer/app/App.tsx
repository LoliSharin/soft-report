import { useState } from 'react';

import { getDesktopApi } from '../logic/get-desktop-api';
import { AboutScreen } from '../ux/screens/AboutScreen';
import { HomeScreen } from '../ux/screens/HomeScreen';

type Page = 'home' | 'about';

export function App() {
  const [page, setPage] = useState<Page>('home');
  const desktopApi = getDesktopApi();

  if (page === 'home') {
    return (
      <HomeScreen
        desktopApi={desktopApi}
        onGoToAbout={() => setPage('about')}
      />
    );
  }

  return <AboutScreen onGoBack={() => setPage('home')} />;
}
