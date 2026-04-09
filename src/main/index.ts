import { app, BrowserWindow } from 'electron';

import { createMainWindow } from './create-main-window';

const isMac = process.platform === 'darwin';

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit();
  }
});
