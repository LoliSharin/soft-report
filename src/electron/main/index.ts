import { app, BrowserWindow } from 'electron';

import { appConfig } from '../../shared/app.config';

import { closeDatabase, initializeDatabase } from './database/db';
import { registerIpcHandlers } from './ipc/register-ipc-handlers';
import { createMainWindow } from './window/create-main-window';

const isMac = process.platform === 'darwin';

app.setName(appConfig.name);

app
  .whenReady()
  .then(async () => {
    await initializeDatabase();
    registerIpcHandlers();
    createMainWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  })
  .catch((startupError) => {
    console.error('Failed to start application.', startupError);
    app.quit();
  });

app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit();
  }
});

app.on('before-quit', () => {
  closeDatabase();
});
