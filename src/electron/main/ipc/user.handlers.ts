import { ipcMain } from 'electron';

import { IPC_CHANNELS } from '../../../shared/ipc-channels';

import {
  createUserForAdmin,
  deleteUserForAdmin,
  listUsersForAdmin,
  updateUserForAdmin,
} from '../services/user.service';

export function registerUserHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.users.list, (event) =>
    listUsersForAdmin(event.sender.id),
  );
  ipcMain.handle(IPC_CHANNELS.users.create, (event, input) =>
    createUserForAdmin(event.sender.id, input),
  );
  ipcMain.handle(IPC_CHANNELS.users.update, (event, id, input) =>
    updateUserForAdmin(event.sender.id, id, input),
  );
  ipcMain.handle(IPC_CHANNELS.users.delete, (event, id) =>
    deleteUserForAdmin(event.sender.id, id),
  );
}
