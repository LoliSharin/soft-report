import { app, BrowserWindow, ipcMain } from 'electron';

import type { CreateNoteInput } from '../shared/note.types';

import { createMainWindow } from './create-main-window';
import { createNote, listNotes } from './database/notes.repository';

const isMac = process.platform === 'darwin';

function registerIpcHandlers(): void {
  ipcMain.handle('notes:list', () => listNotes());
  ipcMain.handle('notes:create', (_event, input: CreateNoteInput) =>
    createNote(input),
  );
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit();
  }
});
