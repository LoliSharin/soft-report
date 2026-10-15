import type { DesktopApi } from '../../../../shared/desktop.types';
import type { DataImportResult } from '../../../../shared/report.types';

import type { NoticeTone } from '../../../app/screen.types';
import { getErrorMessage } from '../../../logic/get-error-message';

interface BackupAdminPanelProps {
  api: DesktopApi;
  notify: (tone: NoticeTone, text: string) => void;
}

export function BackupAdminPanel({ api, notify }: BackupAdminPanelProps) {
  function formatImportStats(result: DataImportResult): string {
    return [
      `добавлено: справочников ${result.added.dictionaries}, мероприятий ${result.added.events}, участников ${result.added.participants}, участий ${result.added.participations}, сертификатов ${result.added.certificates}`,
      `пропущено дублей: справочников ${result.skipped.dictionaries}, мероприятий ${result.skipped.events}, участников ${result.skipped.participants}, участий ${result.skipped.participations}, сертификатов ${result.skipped.certificates}`,
    ].join('; ');
  }

  async function handleBackup(): Promise<void> {
    try {
      const result = await api.system.backupDatabase();

      if (!result) {
        notify(
          'error',
          '\u0421\u043e\u0437\u0434\u0430\u043d\u0438\u0435 \u0440\u0435\u0437\u0435\u0440\u0432\u043d\u043e\u0439 \u043a\u043e\u043f\u0438\u0438 \u043e\u0442\u043c\u0435\u043d\u0435\u043d\u043e.',
        );
        return;
      }

      notify(
        'success',
        `\u0420\u0435\u0437\u0435\u0440\u0432\u043d\u0430\u044f \u043a\u043e\u043f\u0438\u044f \u0441\u043e\u0437\u0434\u0430\u043d\u0430: ${result.filePath}`,
      );
    } catch (backupError) {
      notify(
        'error',
        getErrorMessage(
          backupError,
          '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0441\u043e\u0437\u0434\u0430\u0442\u044c \u0440\u0435\u0437\u0435\u0440\u0432\u043d\u0443\u044e \u043a\u043e\u043f\u0438\u044e.',
        ),
      );
    }
  }

  async function handleExport(): Promise<void> {
    try {
      const result = await api.system.exportData();

      if (!result) {
        notify('error', 'Экспорт данных отменен.');
        return;
      }

      notify(
        'success',
        `Данные экспортированы: ${result.filePath}. Мероприятий: ${result.eventCount}, участников: ${result.participantCount}, участий: ${result.participationCount}, сертификатов: ${result.certificateCount}.`,
      );
    } catch (exportError) {
      notify(
        'error',
        getErrorMessage(exportError, 'Не удалось экспортировать данные.'),
      );
    }
  }

  async function handleImport(): Promise<void> {
    try {
      const result = await api.system.importData();

      if (!result) {
        notify('error', 'Импорт данных отменен.');
        return;
      }

      notify(
        'success',
        `Данные импортированы. ${formatImportStats(result)}. Резервная копия перед импортом: ${result.backupFilePath}`,
      );
    } catch (importError) {
      notify(
        'error',
        getErrorMessage(importError, 'Не удалось импортировать данные.'),
      );
    }
  }

  return (
    <div className="admin-panel">
      <header className="admin-panel__header">
        <div>
          <h3>
            {'\u0420\u0435\u0437\u0435\u0440\u0432\u043d\u0430\u044f \u043a\u043e\u043f\u0438\u044f \u0431\u0430\u0437\u044b \u0434\u0430\u043d\u043d\u044b\u0445'}
          </h3>
          <p>
            {
              '\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u043a\u043e\u043f\u0438\u044e \u0442\u0435\u043a\u0443\u0449\u0435\u0439 \u043b\u043e\u043a\u0430\u043b\u044c\u043d\u043e\u0439 \u0431\u0430\u0437\u044b SQLite \u0441 \u043e\u0442\u043c\u0435\u0442\u043a\u043e\u0439 \u0432\u0440\u0435\u043c\u0435\u043d\u0438.'
            }
          </p>
        </div>
      </header>

      <div className="backup-panel">
        <p>
          {
            '\u0420\u0435\u0437\u0435\u0440\u0432\u043d\u043e\u0435 \u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u043e \u0442\u043e\u043b\u044c\u043a\u043e \u0430\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440\u0430\u043c \u0438 \u0441\u043e\u0445\u0440\u0430\u043d\u044f\u0435\u0442 \u0442\u0435\u043a\u0443\u0449\u0443\u044e \u0431\u0430\u0437\u0443 SQLite \u0432 \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u044b\u0439 \u043f\u0443\u0442\u044c.'
          }
        </p>
        <div className="backup-panel__actions">
          <button
            className="button button--primary"
            onClick={handleBackup}
            type="button"
          >
            {'\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0440\u0435\u0437\u0435\u0440\u0432\u043d\u0443\u044e \u043a\u043e\u043f\u0438\u044e'}
          </button>
          <button
            className="button button--ghost"
            onClick={handleExport}
            type="button"
          >
            Экспортировать данные
          </button>
          <button
            className="button button--ghost"
            onClick={handleImport}
            type="button"
          >
            Импортировать данные
          </button>
        </div>
        <p>
          Импорт добавляет только недостающие записи и не удаляет текущие данные.
          Пользователи и пароли не импортируются.
        </p>
      </div>
    </div>
  );
}
