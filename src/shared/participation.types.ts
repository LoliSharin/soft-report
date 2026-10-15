import type { ParticipantType } from './participant.types';

export interface ParticipationRecord {
  id: number;
  eventId: number;
  eventTitle: string;
  eventDate: string;
  eventLevelLabel: string;
  participantId: number;
  participantName: string;
  participantType: ParticipantType;
  supervisorId: number | null;
  supervisorName: string | null;
  resultId: number;
  resultLabel: string;
  notes: string | null;
  certificateImageName: string | null;
  createdAt: string;
}

export interface ParticipationInput {
  eventId: number;
  participantId: number;
  supervisorId?: number | null;
  resultId: number;
  notes?: string | null;
  certificateSourcePath?: string | null;
  clearCertificateImage?: boolean;
}

export interface ParticipationCertificateSelection {
  sourcePath: string;
  fileName: string;
}

export interface ParticipationCertificatePreview {
  fileName: string;
  dataUrl: string;
}
