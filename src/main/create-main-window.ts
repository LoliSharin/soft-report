import { BrowserWindow } from 'electron';
import * as path from 'node:path';

import { appConfig } from '../shared/app.config';

async function loadRenderer(mainWindow: BrowserWindow): Promise<void> {
  const rendererUrl = process.env.ELECTRON_RENDERER_URL;

  if (rendererUrl) {
    await mainWindow.loadURL(rendererUrl);
    return;
  }

  await mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
}

export function createMainWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    title: appConfig.name,
    width: appConfig.window.width,
    height: appConfig.window.height,
    minWidth: appConfig.window.minWidth,
    minHeight: appConfig.window.minHeight,
    show: false,
    backgroundColor: '#f1f5f9',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.removeMenu();
  void loadRenderer(mainWindow);
  mainWindow.once('ready-to-show', () => mainWindow.show());

  return mainWindow;
}
