import { registerAuthHandlers } from './auth.handlers';
import { registerDictionaryHandlers } from './dictionary.handlers';
import { registerEventHandlers } from './event.handlers';
import { registerParticipantHandlers } from './participant.handlers';
import { registerParticipationHandlers } from './participation.handlers';
import { registerReportHandlers } from './report.handlers';
import { registerSystemHandlers } from './system.handlers';
import { registerUserHandlers } from './user.handlers';

export function registerIpcHandlers(): void {
  registerAuthHandlers();
  registerUserHandlers();
  registerDictionaryHandlers();
  registerEventHandlers();
  registerParticipantHandlers();
  registerParticipationHandlers();
  registerReportHandlers();
  registerSystemHandlers();
}
