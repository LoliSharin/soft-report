import { ipcRenderer } from 'electron';

import type { DesktopApi } from '../shared/desktop.types';
import type { CreateNoteInput, Note } from '../shared/note.types';
import { appConfig } from '../shared/app.config';

export function createDesktopApi(): DesktopApi {
  return {
    appName: appConfig.name,
    platform: process.platform,
    versions: {
      electron: process.versions.electron,
      node: process.versions.node,
      chrome: process.versions.chrome,
    },
    notes: {
      list: () => ipcRenderer.invoke('notes:list') as Promise<Note[]>,
      create: (input: CreateNoteInput) =>
        ipcRenderer.invoke('notes:create', input) as Promise<Note>,
    },
  };
}
