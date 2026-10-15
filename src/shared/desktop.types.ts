import type { AuthSession, LoginInput, UserInput, UserRecord } from './auth.types';
import type { DictionaryInput, DictionaryRecord, DictionaryType } from './dictionary.types';
import type { EventInput, EventRecord } from './event.types';
import type { ParticipantInput, ParticipantRecord } from './participant.types';
import type {
  ParticipationCertificatePreview,
  ParticipationCertificateSelection,
  ParticipationInput,
  ParticipationRecord,
} from './participation.types';
import type {
  BackupResult,
  DataExportResult,
  DataImportResult,
  ReportRequest,
  ReportResult,
} from './report.types';

export interface DesktopVersions {
  electron: string;
  node: string;
  chrome: string;
}

export interface AuthApi {
  login: (input: LoginInput) => Promise<AuthSession>;
  logout: () => Promise<void>;
  getSession: () => Promise<AuthSession | null>;
}

export interface UsersApi {
  list: () => Promise<UserRecord[]>;
  create: (input: UserInput) => Promise<UserRecord>;
  update: (id: number, input: UserInput) => Promise<UserRecord>;
  delete: (id: number) => Promise<void>;
}

export interface DictionariesApi {
  list: (type?: DictionaryType) => Promise<DictionaryRecord[]>;
  create: (input: DictionaryInput) => Promise<DictionaryRecord>;
  update: (id: number, input: DictionaryInput) => Promise<DictionaryRecord>;
  delete: (id: number) => Promise<void>;
}

export interface EventsApi {
  list: () => Promise<EventRecord[]>;
  create: (input: EventInput) => Promise<EventRecord>;
  update: (id: number, input: EventInput) => Promise<EventRecord>;
  delete: (id: number) => Promise<void>;
}

export interface ParticipantsApi {
  list: () => Promise<ParticipantRecord[]>;
  create: (input: ParticipantInput) => Promise<ParticipantRecord>;
  update: (id: number, input: ParticipantInput) => Promise<ParticipantRecord>;
  delete: (id: number) => Promise<void>;
}

export interface ParticipationsApi {
  list: () => Promise<ParticipationRecord[]>;
  create: (input: ParticipationInput) => Promise<ParticipationRecord>;
  update: (id: number, input: ParticipationInput) => Promise<ParticipationRecord>;
  delete: (id: number) => Promise<void>;
  selectCertificateImage: () => Promise<ParticipationCertificateSelection | null>;
  getCertificatePreview: (id: number) => Promise<ParticipationCertificatePreview>;
  downloadCertificateImage: (id: number) => Promise<string | null>;
  openCertificateImage: (id: number) => Promise<void>;
}

export interface ReportsApi {
  generate: (input: ReportRequest) => Promise<ReportResult | null>;
}

export interface SystemApi {
  backupDatabase: () => Promise<BackupResult | null>;
  exportData: () => Promise<DataExportResult | null>;
  importData: () => Promise<DataImportResult | null>;
}

export interface DesktopApi {
  appName: string;
  platform: string;
  versions: DesktopVersions;
  auth: AuthApi;
  users: UsersApi;
  dictionaries: DictionariesApi;
  events: EventsApi;
  participants: ParticipantsApi;
  participations: ParticipationsApi;
  reports: ReportsApi;
  system: SystemApi;
}
