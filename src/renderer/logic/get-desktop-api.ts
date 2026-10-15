import { appConfig } from '../../shared/app.config';
import type { AuthSession, LoginInput, UserInput, UserRecord } from '../../shared/auth.types';
import type { DesktopApi } from '../../shared/desktop.types';
import type { DictionaryInput, DictionaryRecord } from '../../shared/dictionary.types';
import type { EventInput, EventRecord } from '../../shared/event.types';
import type { ParticipantInput, ParticipantRecord } from '../../shared/participant.types';
import type {
  ParticipationCertificatePreview,
  ParticipationCertificateSelection,
  ParticipationInput,
  ParticipationRecord,
} from '../../shared/participation.types';
import type {
  BackupResult,
  DataExportResult,
  DataImportResult,
  ReportRequest,
  ReportResult,
} from '../../shared/report.types';

declare global {
  interface Window {
    desktop?: DesktopApi;
  }
}

function unavailable(): never {
  throw new Error(
    '\u0418\u043d\u0442\u0435\u0440\u0444\u0435\u0439\u0441 \u043d\u0430\u0441\u0442\u043e\u043b\u044c\u043d\u043e\u0433\u043e \u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u0438\u044f \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d. \u041f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 \u043d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0443 preload.',
  );
}

const fallbackDesktopApi: DesktopApi = {
  appName: appConfig.displayName,
  platform: 'unknown',
  versions: {
    electron: 'unavailable',
    node: 'unavailable',
    chrome: 'unavailable',
  },
  auth: {
    login: async (_input: LoginInput): Promise<AuthSession> => unavailable(),
    logout: async (): Promise<void> => unavailable(),
    getSession: async (): Promise<AuthSession | null> => null,
  },
  users: {
    list: async (): Promise<UserRecord[]> => unavailable(),
    create: async (_input: UserInput): Promise<UserRecord> => unavailable(),
    update: async (_id: number, _input: UserInput): Promise<UserRecord> =>
      unavailable(),
    delete: async (_id: number): Promise<void> => unavailable(),
  },
  dictionaries: {
    list: async (): Promise<DictionaryRecord[]> => unavailable(),
    create: async (_input: DictionaryInput): Promise<DictionaryRecord> =>
      unavailable(),
    update: async (
      _id: number,
      _input: DictionaryInput,
    ): Promise<DictionaryRecord> => unavailable(),
    delete: async (_id: number): Promise<void> => unavailable(),
  },
  events: {
    list: async (): Promise<EventRecord[]> => unavailable(),
    create: async (_input: EventInput): Promise<EventRecord> => unavailable(),
    update: async (_id: number, _input: EventInput): Promise<EventRecord> =>
      unavailable(),
    delete: async (_id: number): Promise<void> => unavailable(),
  },
  participants: {
    list: async (): Promise<ParticipantRecord[]> => unavailable(),
    create: async (_input: ParticipantInput): Promise<ParticipantRecord> =>
      unavailable(),
    update: async (
      _id: number,
      _input: ParticipantInput,
    ): Promise<ParticipantRecord> => unavailable(),
    delete: async (_id: number): Promise<void> => unavailable(),
  },
  participations: {
    list: async (): Promise<ParticipationRecord[]> => unavailable(),
    create: async (
      _input: ParticipationInput,
    ): Promise<ParticipationRecord> => unavailable(),
    update: async (
      _id: number,
      _input: ParticipationInput,
    ): Promise<ParticipationRecord> => unavailable(),
    delete: async (_id: number): Promise<void> => unavailable(),
    selectCertificateImage: async (): Promise<ParticipationCertificateSelection | null> =>
      unavailable(),
    getCertificatePreview: async (_id: number): Promise<ParticipationCertificatePreview> =>
      unavailable(),
    downloadCertificateImage: async (_id: number): Promise<string | null> =>
      unavailable(),
    openCertificateImage: async (_id: number): Promise<void> => unavailable(),
  },
  reports: {
    generate: async (_input: ReportRequest): Promise<ReportResult | null> =>
      unavailable(),
  },
  system: {
    backupDatabase: async (): Promise<BackupResult | null> => unavailable(),
    exportData: async (): Promise<DataExportResult | null> => unavailable(),
    importData: async (): Promise<DataImportResult | null> => unavailable(),
  },
};

export function getDesktopApi(): DesktopApi {
  return window.desktop ?? fallbackDesktopApi;
}
