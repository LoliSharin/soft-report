import { appConfig } from '../../shared/app.config';
import type { DesktopApi } from '../../shared/desktop.types';
import type { CreateNoteInput, Note } from '../../shared/note.types';

declare global {
  interface Window {
    desktop?: DesktopApi;
  }
}

const fallbackNotesApi = {
  list: async (): Promise<Note[]> => [],
  create: async (input: CreateNoteInput): Promise<Note> => ({
    id: Date.now(),
    title: input.title.trim() || 'Untitled note',
    createdAt: new Date().toISOString(),
  }),
};

const fallbackDesktopApi: DesktopApi = {
  appName: appConfig.name,
  platform: 'unknown',
  versions: {
    electron: 'unavailable',
    node: 'unavailable',
    chrome: 'unavailable',
  },
  notes: fallbackNotesApi,
};

export function getDesktopApi(): DesktopApi {
  if (!window.desktop) {
    console.warn('Preload desktop API is unavailable. Fallback data is used.');
    return fallbackDesktopApi;
  }

  return window.desktop;
}
