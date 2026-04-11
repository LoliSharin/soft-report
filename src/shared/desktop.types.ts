import type { CreateNoteInput, Note } from './note.types';

export interface DesktopVersions {
  electron: string;
  node: string;
  chrome: string;
}

export interface NotesApi {
  list: () => Promise<Note[]>;
  create: (input: CreateNoteInput) => Promise<Note>;
}

export interface DesktopApi {
  appName: string;
  platform: string;
  versions: DesktopVersions;
  notes: NotesApi;
}
