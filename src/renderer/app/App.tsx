import { getDesktopApi } from '../logic/get-desktop-api';
import { HomeScreen } from '../ux/screens/HomeScreen';

export function App() {
  return <HomeScreen desktopApi={getDesktopApi()} />;
}
