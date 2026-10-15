import { ipcMain } from 'electron';

import { IPC_CHANNELS } from '../../../shared/ipc-channels';

import {
  createEventForUser,
  deleteEventForUser,
  listEventsForUser,
  updateEventForUser,
} from '../services/event.service';

export function registerEventHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.events.list, (event) =>
    listEventsForUser(event.sender.id),
  );
  ipcMain.handle(IPC_CHANNELS.events.create, (event, input) =>
    createEventForUser(event.sender.id, input),
  );
  ipcMain.handle(IPC_CHANNELS.events.update, (event, id, input) =>
    updateEventForUser(event.sender.id, id, input),
  );
  ipcMain.handle(IPC_CHANNELS.events.delete, (event, id) =>
    deleteEventForUser(event.sender.id, id),
  );
}
