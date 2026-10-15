import { ipcMain } from 'electron';

import { IPC_CHANNELS } from '../../../shared/ipc-channels';

import { getCurrentSession, login, logout } from '../services/auth.service';

export function registerAuthHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.auth.login, (event, input) =>
    login(event.sender.id, input),
  );
  ipcMain.handle(IPC_CHANNELS.auth.logout, (event) => {
    logout(event.sender.id);
  });
  ipcMain.handle(IPC_CHANNELS.auth.getSession, (event) =>
    getCurrentSession(event.sender.id),
  );
}
