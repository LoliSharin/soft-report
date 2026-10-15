import { copyFile } from 'node:fs/promises';
import { join } from 'node:path';

import { app, dialog, type BrowserWindow } from 'electron';

import type { BackupResult } from '../../../shared/report.types';
import { appConfig } from '../../../shared/app.config';

import { getDatabasePath } from '../database/db';

import { requireAdminSession } from './session.service';

function createTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

export async function backupDatabaseForAdmin(
  webContentsId: number,
  window: BrowserWindow,
): Promise<BackupResult | null> {
  requireAdminSession(webContentsId);

  const fileName = `${appConfig.database.backupPrefix}-${createTimestamp()}.db`;
  const saveDialog = await dialog.showSaveDialog(window, {
    title:
      '\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0440\u0435\u0437\u0435\u0440\u0432\u043d\u0443\u044e \u043a\u043e\u043f\u0438\u044e \u0431\u0430\u0437\u044b \u0434\u0430\u043d\u043d\u044b\u0445',
    defaultPath: join(app.getPath('documents'), fileName),
    filters: [
      {
        name: '\u0411\u0430\u0437\u0430 \u0434\u0430\u043d\u043d\u044b\u0445 SQLite',
        extensions: ['db', 'sqlite'],
      },
    ],
  });

  if (saveDialog.canceled || !saveDialog.filePath) {
    return null;
  }

  await copyFile(getDatabasePath(), saveDialog.filePath);

  return {
    filePath: saveDialog.filePath,
  };
}
