import type { AuthSession } from '../../shared/auth.types';
import type { DesktopApi } from '../../shared/desktop.types';

export type NoticeTone = 'success' | 'error';
export type AppScreen =
  | 'events'
  | 'participants'
  | 'participations'
  | 'reports'
  | 'admin';

export interface AppNotice {
  tone: NoticeTone;
  text: string;
}

export interface ScreenProps {
  api: DesktopApi;
  session: AuthSession;
  notify: (tone: NoticeTone, text: string) => void;
}
