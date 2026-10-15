export type DictionaryType = 'event_level' | 'participation_result';

export interface DictionaryRecord {
  id: number;
  type: DictionaryType;
  code: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface DictionaryInput {
  type: DictionaryType;
  label: string;
  sortOrder: number;
  isActive: boolean;
}
