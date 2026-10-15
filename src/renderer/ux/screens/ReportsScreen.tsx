import { useEffect, useState } from 'react';

import type { ReportKind } from '../../../shared/report.types';

import type { ScreenProps } from '../../app/screen.types';
import { getErrorMessage } from '../../logic/get-error-message';

const ALL_YEARS_VALUE = 'all';

const reportButtons: Array<{
  kind: ReportKind;
  title: string;
  description: string;
}> = [
  {
    kind: 'summary',
    title: '\u0421\u0432\u043e\u0434\u043d\u044b\u0439 \u043e\u0442\u0447\u0435\u0442',
    description:
      '\u0412\u0441\u0435 \u0437\u0430\u043f\u0438\u0441\u0438 \u0443\u0447\u0430\u0441\u0442\u0438\u044f \u0432 \u043e\u0434\u043d\u043e\u043c \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u0435 Word.',
  },
  {
    kind: 'teachers',
    title:
      '\u041e\u0442\u0447\u0435\u0442 \u043f\u043e \u043f\u0440\u0435\u043f\u043e\u0434\u0430\u0432\u0430\u0442\u0435\u043b\u044f\u043c',
    description:
      '\u0417\u0430\u043f\u0438\u0441\u0438 \u0443\u0447\u0430\u0441\u0442\u0438\u044f \u0438 \u0430\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u0438 \u043f\u0440\u0435\u043f\u043e\u0434\u0430\u0432\u0430\u0442\u0435\u043b\u0435\u0439.',
  },
  {
    kind: 'students',
    title:
      '\u041e\u0442\u0447\u0435\u0442 \u043f\u043e \u043e\u0431\u0443\u0447\u0430\u044e\u0449\u0438\u043c\u0441\u044f',
    description:
      '\u0417\u0430\u043f\u0438\u0441\u0438 \u0443\u0447\u0430\u0441\u0442\u0438\u044f \u043e\u0431\u0443\u0447\u0430\u044e\u0449\u0438\u0445\u0441\u044f \u0441 \u0440\u0443\u043a\u043e\u0432\u043e\u0434\u0438\u0442\u0435\u043b\u044f\u043c\u0438 \u0438 \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u0430\u043c\u0438.',
  },
];

function extractYear(date: string): number | null {
  const year = Number(date.slice(0, 4));

  return Number.isInteger(year) ? year : null;
}

export function ReportsScreen({ api, notify }: ScreenProps) {
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(ALL_YEARS_VALUE);

  useEffect(() => {
    async function loadAvailableYears(): Promise<void> {
      try {
        const events = await api.events.list();
        const years = Array.from(
          new Set(
            events
              .map((eventRecord) => extractYear(eventRecord.eventDate))
              .filter((year): year is number => year !== null),
          ),
        ).sort((left, right) => right - left);

        setAvailableYears(years);
      } catch (loadError) {
        notify(
          'error',
          getErrorMessage(
            loadError,
            'Не удалось загрузить доступные годы для отчетов.',
          ),
        );
      }
    }

    void loadAvailableYears();
  }, []);

  useEffect(() => {
    if (
      selectedYear !== ALL_YEARS_VALUE &&
      !availableYears.includes(Number(selectedYear))
    ) {
      setSelectedYear(ALL_YEARS_VALUE);
    }
  }, [availableYears, selectedYear]);

  async function handleGenerate(kind: ReportKind): Promise<void> {
    try {
      const year = selectedYear === ALL_YEARS_VALUE ? null : Number(selectedYear);
      const result = await api.reports.generate({ kind, year });

      if (!result) {
        notify(
          'error',
          '\u0413\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u044f \u043e\u0442\u0447\u0435\u0442\u0430 \u043e\u0442\u043c\u0435\u043d\u0435\u043d\u0430.',
        );
        return;
      }

      notify(
        'success',
        `Отчет сохранен: ${result.filePath}. Записей: ${result.recordCount}${result.year === null ? '' : `. Год: ${result.year}`}.`,
      );
    } catch (reportError) {
      notify(
        'error',
        getErrorMessage(
          reportError,
          '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0441\u0444\u043e\u0440\u043c\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u043e\u0442\u0447\u0435\u0442.',
        ),
      );
    }
  }

  return (
    <section className="screen-card">
      <header className="screen-card__header">
        <div>
          <p className="screen-card__eyebrow">{'\u0412\u044b\u0433\u0440\u0443\u0437\u043a\u0430'}</p>
          <h2 className="screen-card__title">{'\u041e\u0442\u0447\u0435\u0442\u044b'}</h2>
        </div>
      </header>

      <div className="toolbar">
        <select
          className="field__input"
          value={selectedYear}
          onChange={(event) => setSelectedYear(event.target.value)}
        >
          <option value={ALL_YEARS_VALUE}>Все годы</option>
          {availableYears.map((year) => (
            <option key={year} value={String(year)}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div className="report-grid">
        {reportButtons.map((report) => (
          <article className="report-card" key={report.kind}>
            <h3>{report.title}</h3>
            <p>{report.description}</p>
            <button
              className="button button--primary"
              onClick={() => handleGenerate(report.kind)}
              type="button"
            >
              {'\u0421\u0444\u043e\u0440\u043c\u0438\u0440\u043e\u0432\u0430\u0442\u044c .docx'}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
