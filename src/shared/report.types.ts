import type { ParticipantType } from './participant.types';

export type ReportKind = 'summary' | 'teachers' | 'students';

export interface ReportRequest {
  kind: ReportKind;
  year: number | null;
}

export interface ReportRow {
  level: string;
  eventDate: string;
  location: string;
  eventTitle: string;
  participantName: string;
  participantType: ParticipantType;
  supervisorName: string | null;
  resultLabel: string;
}

export interface ReportResult {
  kind: ReportKind;
  year: number | null;
  recordCount: number;
  filePath: string;
}

export interface BackupResult {
  filePath: string;
}

export interface DataExportResult {
  filePath: string;
  dictionaryCount: number;
  eventCount: number;
  participantCount: number;
  participationCount: number;
  certificateCount: number;
}

export interface DataImportStats {
  dictionaries: number;
  events: number;
  participants: number;
  participations: number;
  certificates: number;
}

export interface DataImportResult {
  filePath: string;
  backupFilePath: string;
  added: DataImportStats;
  skipped: DataImportStats;
}
