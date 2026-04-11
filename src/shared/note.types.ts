export interface Note {
  id: number;
  title: string;
  createdAt: string;
}

export interface CreateNoteInput {
  title: string;
}
