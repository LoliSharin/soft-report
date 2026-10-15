import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { app, dialog, type BrowserWindow } from 'electron';
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

import type {
  ReportKind,
  ReportRequest,
  ReportResult,
  ReportRow,
} from '../../../shared/report.types';

import { listReportRows } from '../repositories/participation.repository';

import { requireSession } from './session.service';

function createTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function normalizeReportYear(year: number | null): number | null {
  if (year === null) {
    return null;
  }

  if (!Number.isInteger(year) || year < 1000 || year > 9999) {
    throw new Error('Год отчета должен быть корректным четырехзначным числом.');
  }

  return year;
}

function getReportTitle(kind: ReportKind, year: number | null): string {
  const baseTitle =
    kind === 'summary'
      ? 'Сводный отчет'
      : kind === 'teachers'
        ? 'Отчет по преподавателям'
        : kind === 'students'
          ? 'Отчет по обучающимся'
          : 'Отчет';

  return year === null ? baseTitle : `${baseTitle} за ${year} год`;
}

function getReportFileName(kind: ReportKind, year: number | null): string {
  const yearPart = year === null ? 'all' : String(year);

  return `${kind}-report-${yearPart}-${createTimestamp()}.docx`;
}

function getEmptyReportMessage(kind: ReportKind, year: number | null): string {
  if (year !== null) {
    return `За ${year} год нет данных для формирования отчета.`;
  }

  switch (kind) {
    case 'summary':
      return 'Нет данных для формирования сводного отчета.';
    case 'teachers':
      return 'Нет данных для формирования отчета по преподавателям.';
    case 'students':
      return 'Нет данных для формирования отчета по обучающимся.';
    default:
      return 'Нет данных для формирования отчета.';
  }
}

function createCell(text: string, bold = false): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold,
          }),
        ],
      }),
    ],
  });
}

function buildReportDocument(title: string, rows: ReportRow[]): Document {
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      createCell('\u0423\u0440\u043e\u0432\u0435\u043d\u044c', true),
      createCell('\u0414\u0430\u0442\u0430', true),
      createCell('\u041c\u0435\u0441\u0442\u043e', true),
      createCell('\u041c\u0435\u0440\u043e\u043f\u0440\u0438\u044f\u0442\u0438\u0435', true),
      createCell('\u0423\u0447\u0430\u0441\u0442\u043d\u0438\u043a', true),
      createCell('\u0420\u0443\u043a\u043e\u0432\u043e\u0434\u0438\u0442\u0435\u043b\u044c', true),
      createCell('\u0420\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442', true),
    ],
  });

  const dataRows = rows.map(
    (row) =>
      new TableRow({
        children: [
          createCell(row.level),
          createCell(row.eventDate),
          createCell(row.location),
          createCell(row.eventTitle),
          createCell(row.participantName),
          createCell(row.supervisorName ?? '-'),
          createCell(row.resultLabel),
        ],
      }),
  );

  return new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun(title)],
          }),
          new Paragraph({
            children: [
              new TextRun(
                `\u0421\u0444\u043e\u0440\u043c\u0438\u0440\u043e\u0432\u0430\u043d\u043e: ${new Date().toLocaleString('ru-RU')}`,
              ),
            ],
          }),
          new Paragraph(''),
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [headerRow, ...dataRows],
          }),
        ],
      },
    ],
  });
}

export async function generateReportForUser(
  webContentsId: number,
  window: BrowserWindow,
  input: ReportRequest,
): Promise<ReportResult | null> {
  requireSession(webContentsId);

  const year = normalizeReportYear(input.year);
  const rows = listReportRows(input.kind, year);

  if (rows.length === 0) {
    throw new Error(getEmptyReportMessage(input.kind, year));
  }

  const title = getReportTitle(input.kind, year);
  const fileName = getReportFileName(input.kind, year);
  const saveDialog = await dialog.showSaveDialog(window, {
    title: `Сохранить ${title}`,
    defaultPath: join(app.getPath('documents'), fileName),
    filters: [
      {
        name: 'Документ Word',
        extensions: ['docx'],
      },
    ],
  });

  if (saveDialog.canceled || !saveDialog.filePath) {
    return null;
  }

  const document = buildReportDocument(title, rows);
  const buffer = await Packer.toBuffer(document);

  await writeFile(saveDialog.filePath, buffer);

  return {
    kind: input.kind,
    year,
    recordCount: rows.length,
    filePath: saveDialog.filePath,
  };
}
