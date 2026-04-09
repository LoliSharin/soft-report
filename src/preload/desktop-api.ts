import type { DesktopApi } from '../shared/desktop.types';
import { appConfig } from '../shared/app.config';

export function createDesktopApi(): DesktopApi {
  return {
    appName: appConfig.name,
    platform: process.platform,
    versions: {
      electron: process.versions.electron,
      node: process.versions.node,
      chrome: process.versions.chrome,
    },
  };
}
