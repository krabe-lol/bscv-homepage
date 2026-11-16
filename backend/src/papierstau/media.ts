// Dateien aus Papierstau (Logos, Dokumente, PDFs der Wertung) in die Medienbibliothek von Strapi legen.
// Der Abgleich löscht nur Dateien, die er selbst angelegt hat (IDs stehen in papierstauSync).

import { mkdtemp, rm, writeFile } from 'fs/promises';
import os from 'os';
import path from 'path';
import type { Core } from '@strapi/strapi';
import type { DownloadedFile } from './client';

const EXTENSIONS: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

// Dateinamen ohne Pfadteile und Steuerzeichen, Endung passend zum Inhalt
const safeName = (name: string, mime: string) => {
  const ext = EXTENSIONS[mime] ?? '';
  const base = name
    .replace(/[/\\]/g, ' ')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .replace(/\.[a-z0-9]{1,5}$/i, '');
  return `${base || 'datei'}${ext}`;
};

export const createMedia = (strapi: Core.Strapi) => {
  const upload = strapi.plugin('upload').service('upload');

  const add = async (file: DownloadedFile, name: string, alternativeText?: string): Promise<number> => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'papierstau-'));
    try {
      const filename = safeName(name, file.mime);
      const filepath = path.join(dir, filename);
      await writeFile(filepath, file.buffer);
      const [saved] = await upload.upload({
        data: { fileInfo: { name: filename, alternativeText: alternativeText ?? null } },
        files: { filepath, originalFilename: filename, mimetype: file.mime, size: file.buffer.length },
      });
      return saved.id as number;
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  };

  const exists = async (id: number | null | undefined) =>
    Boolean(id && (await strapi.db.query('plugin::upload.file').findOne({ where: { id }, select: ['id'] })));

  const remove = async (id: number | null | undefined) => {
    if (!id) return;
    const file = await strapi.db.query('plugin::upload.file').findOne({ where: { id } });
    if (file) await upload.remove(file);
  };

  return { add, exists, remove };
};

export type Media = ReturnType<typeof createMedia>;
