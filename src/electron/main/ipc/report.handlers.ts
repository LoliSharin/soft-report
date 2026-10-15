import { BrowserWindow, ipcMain } from 'electron';

import { IPC_CHANNELS } from '../../../shared/ipc-channels';
import type { ReportRequest } from '../../../shared/report.types';

import { generateReportForUser } from '../services/report.service';

export function registerReportHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.reports.generate,
    async (event, input: ReportRequest) => {
      const window = BrowserWindow.fromWebContents(event.sender);

      if (!window) {
        throw new Error('Unable to resolve the current application window.');
      }

      return generateReportForUser(event.sender.id, window, input);
    },
  );
}
