import { BrowserWindow, ipcMain } from 'electron';

import { IPC_CHANNELS } from '../../../shared/ipc-channels';

import {
  createParticipationForUser,
  deleteParticipationForUser,
  downloadParticipationCertificateForUser,
  getParticipationCertificatePreviewForUser,
  listParticipationsForUser,
  openParticipationCertificateForUser,
  selectParticipationCertificateForUser,
  updateParticipationForUser,
} from '../services/participation.service';

export function registerParticipationHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.participations.list, (event) =>
    listParticipationsForUser(event.sender.id),
  );
  ipcMain.handle(IPC_CHANNELS.participations.create, (event, input) =>
    createParticipationForUser(event.sender.id, input),
  );
  ipcMain.handle(IPC_CHANNELS.participations.update, (event, id, input) =>
    updateParticipationForUser(event.sender.id, id, input),
  );
  ipcMain.handle(IPC_CHANNELS.participations.delete, (event, id) =>
    deleteParticipationForUser(event.sender.id, id),
  );
  ipcMain.handle(
    IPC_CHANNELS.participations.selectCertificateImage,
    async (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);

      if (!window) {
        throw new Error(
          '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u043f\u0440\u0435\u0434\u0435\u043b\u0438\u0442\u044c \u043e\u043a\u043d\u043e \u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u0438\u044f.',
        );
      }

      return selectParticipationCertificateForUser(event.sender.id, window);
    },
  );
  ipcMain.handle(
    IPC_CHANNELS.participations.getCertificatePreview,
    (event, id) => getParticipationCertificatePreviewForUser(event.sender.id, id),
  );
  ipcMain.handle(
    IPC_CHANNELS.participations.downloadCertificateImage,
    async (event, id) => {
      const window = BrowserWindow.fromWebContents(event.sender);

      if (!window) {
        throw new Error(
          '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u043f\u0440\u0435\u0434\u0435\u043b\u0438\u0442\u044c \u043e\u043a\u043d\u043e \u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u0438\u044f.',
        );
      }

      return downloadParticipationCertificateForUser(
        event.sender.id,
        id,
        window,
      );
    },
  );
  ipcMain.handle(
    IPC_CHANNELS.participations.openCertificateImage,
    (event, id) => openParticipationCertificateForUser(event.sender.id, id),
  );
}
