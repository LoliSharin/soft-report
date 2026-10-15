import { ipcMain } from 'electron';

import { IPC_CHANNELS } from '../../../shared/ipc-channels';

import {
  createDictionaryForAdmin,
  deleteDictionaryForAdmin,
  listDictionariesForUser,
  updateDictionaryForAdmin,
} from '../services/dictionary.service';

export function registerDictionaryHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.dictionaries.list, (event, type) =>
    listDictionariesForUser(event.sender.id, type),
  );
  ipcMain.handle(IPC_CHANNELS.dictionaries.create, (event, input) =>
    createDictionaryForAdmin(event.sender.id, input),
  );
  ipcMain.handle(IPC_CHANNELS.dictionaries.update, (event, id, input) =>
    updateDictionaryForAdmin(event.sender.id, id, input),
  );
  ipcMain.handle(IPC_CHANNELS.dictionaries.delete, (event, id) =>
    deleteDictionaryForAdmin(event.sender.id, id),
  );
}
