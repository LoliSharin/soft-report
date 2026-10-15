import { ipcMain } from 'electron';

import { IPC_CHANNELS } from '../../../shared/ipc-channels';

import {
  createParticipantForUser,
  deleteParticipantForUser,
  listParticipantsForUser,
  updateParticipantForUser,
} from '../services/participant.service';

export function registerParticipantHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.participants.list, (event) =>
    listParticipantsForUser(event.sender.id),
  );
  ipcMain.handle(IPC_CHANNELS.participants.create, (event, input) =>
    createParticipantForUser(event.sender.id, input),
  );
  ipcMain.handle(IPC_CHANNELS.participants.update, (event, id, input) =>
    updateParticipantForUser(event.sender.id, id, input),
  );
  ipcMain.handle(IPC_CHANNELS.participants.delete, (event, id) =>
    deleteParticipantForUser(event.sender.id, id),
  );
}
