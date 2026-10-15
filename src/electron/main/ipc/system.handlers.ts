import { BrowserWindow, ipcMain } from 'electron';

import { IPC_CHANNELS } from '../../../shared/ipc-channels';

import { backupDatabaseForAdmin } from '../services/backup.service';
import {
  exportDataForAdmin,
  importDataForAdmin,
} from '../services/data-transfer.service';

export function registerSystemHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.system.backupDatabase, async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);

    if (!window) {
      throw new Error('Unable to resolve the current application window.');
    }

    return backupDatabaseForAdmin(event.sender.id, window);
  });

  ipcMain.handle(IPC_CHANNELS.system.exportData, async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);

    if (!window) {
      throw new Error('Unable to resolve the current application window.');
    }

    return exportDataForAdmin(event.sender.id, window);
  });

  ipcMain.handle(IPC_CHANNELS.system.importData, async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);

    if (!window) {
      throw new Error('Unable to resolve the current application window.');
    }

    return importDataForAdmin(event.sender.id, window);
  });
}
