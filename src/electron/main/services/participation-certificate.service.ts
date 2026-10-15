import { existsSync } from 'node:fs';
import { copyFile, mkdir, readFile, unlink } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';

import { randomUUID } from 'node:crypto';

import { app, dialog, shell, type BrowserWindow } from 'electron';

import { appConfig } from '../../../shared/app.config';
import type {
  ParticipationCertificatePreview,
  ParticipationCertificateSelection,
} from '../../../shared/participation.types';

function getCertificatesDirectory(): string {
  return join(
    app.getPath('userData'),
    appConfig.storage.participationCertificatesDir,
  );
}

async function ensureCertificatesDirectory(): Promise<string> {
  const directoryPath = getCertificatesDirectory();
  await mkdir(directoryPath, { recursive: true });

  return directoryPath;
}

function sanitizeFileName(fileName: string): string {
  const extension = extname(fileName).toLowerCase();
  const baseName = basename(fileName, extension)
    .trim()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  return `${baseName || 'certificate'}${extension}`;
}

async function createStoredFileName(originalFileName: string): Promise<string> {
  const directoryPath = await ensureCertificatesDirectory();
  const safeFileName = sanitizeFileName(originalFileName);
  const extension = extname(safeFileName);
  const baseName = basename(safeFileName, extension);

  let candidate = safeFileName;
  let index = 1;

  while (existsSync(join(directoryPath, candidate))) {
    candidate = `${baseName}-${index}${extension}`;
    index += 1;
  }

  return candidate;
}

function getStoredCertificatePath(fileName: string): string {
  return join(getCertificatesDirectory(), fileName);
}

function getImageMimeType(fileName: string): string {
  switch (extname(fileName).toLowerCase()) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.bmp':
      return 'image/bmp';
    default:
      return 'application/octet-stream';
  }
}

export async function selectParticipationCertificateImage(
  window: BrowserWindow,
): Promise<ParticipationCertificateSelection | null> {
  const selection = await dialog.showOpenDialog(window, {
    title:
      '\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0444\u043e\u0442\u043e \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043a\u0430\u0442\u0430',
    properties: ['openFile'],
    filters: [
      {
        name: '\u0418\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u044f',
        extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp'],
      },
    ],
  });

  if (selection.canceled || selection.filePaths.length === 0) {
    return null;
  }

  const sourcePath = selection.filePaths[0];

  return {
    sourcePath,
    fileName: basename(sourcePath),
  };
}

export async function storeParticipationCertificate(
  sourcePath: string,
): Promise<string> {
  const directoryPath = await ensureCertificatesDirectory();
  const originalFileName =
    basename(sourcePath).trim() || `${randomUUID()}.png`;
  const storedFileName = await createStoredFileName(originalFileName);

  await copyFile(sourcePath, join(directoryPath, storedFileName));

  return storedFileName;
}

export async function deleteStoredParticipationCertificate(
  fileName: string | null | undefined,
): Promise<void> {
  if (!fileName) {
    return;
  }

  try {
    await unlink(getStoredCertificatePath(fileName));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

export async function openStoredParticipationCertificate(
  fileName: string,
): Promise<void> {
  const errorMessage = await shell.openPath(getStoredCertificatePath(fileName));

  if (errorMessage) {
    throw new Error(
      '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0442\u043a\u0440\u044b\u0442\u044c \u0444\u043e\u0442\u043e \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043a\u0430\u0442\u0430.',
    );
  }
}

export async function getStoredParticipationCertificatePreview(
  fileName: string,
): Promise<ParticipationCertificatePreview> {
  const fileBuffer = await readFile(getStoredCertificatePath(fileName));

  return {
    fileName,
    dataUrl: `data:${getImageMimeType(fileName)};base64,${fileBuffer.toString('base64')}`,
  };
}

export async function downloadStoredParticipationCertificate(
  fileName: string,
  window: BrowserWindow,
): Promise<string | null> {
  const targetFilePath = getStoredCertificatePath(fileName);
  const saveDialog = await dialog.showSaveDialog(window, {
    title:
      '\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u0444\u043e\u0442\u043e \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043a\u0430\u0442\u0430',
    defaultPath: join(app.getPath('documents'), fileName),
    filters: [
      {
        name: '\u0418\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u044f',
        extensions: [
          extname(fileName).replace('.', '').toLowerCase() || 'png',
        ],
      },
    ],
  });

  if (saveDialog.canceled || !saveDialog.filePath) {
    return null;
  }

  await copyFile(targetFilePath, saveDialog.filePath);

  return saveDialog.filePath;
}
