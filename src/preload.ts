import { contextBridge } from 'electron';

import { appConfig } from './app.module';

contextBridge.exposeInMainWorld('desktop', {
  appName: appConfig.name,
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    node: process.versions.node,
    chrome: process.versions.chrome,
  },
});
