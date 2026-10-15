import { existsSync } from 'node:fs';
import * as path from 'node:path';

import { app, BrowserWindow } from 'electron';

import { appConfig } from '../../../shared/app.config';

import { clearSession } from '../services/session.service';

async function loadRenderer(mainWindow: BrowserWindow): Promise<void> {
  const rendererUrl = process.env.ELECTRON_RENDERER_URL;

  if (rendererUrl) {
    await mainWindow.loadURL(rendererUrl);
    return;
  }

  await mainWindow.loadFile(
    path.join(__dirname, '..', '..', '..', 'renderer', 'index.html'),
  );
}

function getWindowIconPath(): string | undefined {
  const candidatePaths = app.isPackaged
    ? [
        path.join(process.resourcesPath, 'build', 'icon.ico'),
        path.join(process.resourcesPath, 'icon.ico'),
      ]
    : [path.join(process.cwd(), 'build', 'icon.ico')];

  return candidatePaths.find((candidatePath) => existsSync(candidatePath));
}

export function createMainWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    title: appConfig.displayName,
    icon: getWindowIconPath(),
    width: appConfig.window.width,
    height: appConfig.window.height,
    minWidth: appConfig.window.minWidth,
    minHeight: appConfig.window.minHeight,
    show: false,
    backgroundColor: '#eef2f6',
    webPreferences: {
      preload: path.join(__dirname, '..', '..', 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // Electron 20+ sandboxes renderers by default. This preload imports
      // local CommonJS modules, so it needs the unsandboxed preload context.
      sandbox: false,
    },
  });

  mainWindow.removeMenu();
  void loadRenderer(mainWindow);
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => {
    clearSession(mainWindow.webContents.id);
  });

  return mainWindow;
}
