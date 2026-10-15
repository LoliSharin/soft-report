export type ParticipantType = 'teacher' | 'student';

export interface ParticipantRecord {
  id: number;
  fullName: string;
  participantType: ParticipantType;
  groupName: string | null;
  positionOrSubject: string | null;
  createdAt: string;
}

export interface ParticipantInput {
  fullName: string;
  participantType: ParticipantType;
  groupName?: string | null;
  positionOrSubject?: string | null;
}
