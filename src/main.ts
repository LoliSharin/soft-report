import { app, BrowserWindow } from 'electron';
import * as path from 'node:path';

import { appConfig } from './app.module';

const isMac = process.platform === 'darwin';

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    title: appConfig.name,
    width: appConfig.window.width,
    height: appConfig.window.height,
    minWidth: appConfig.window.minWidth,
    minHeight: appConfig.window.minHeight,
    show: false,
    backgroundColor: '#f1f5f9',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  window.removeMenu();
  void window.loadFile(path.join(__dirname, '..', 'index.html'));
  window.once('ready-to-show', () => window.show());

  return window;
}

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
