// Stand auf bscv.de je Eintrag aus Papierstau (GET /api/papierstau/state). Papierstau vergleicht sourceHash mit dem
// Fingerabdruck seiner eigenen API-Antwort (kanonisches JSON, siehe map.ts) und erkennt so veraltete oder fehlende
// Einträge, ohne Inhalte vergleichen zu müssen.

import type { Core } from '@strapi/strapi';
import { docs, publishedIds, UIDS, type Scope } from './sync';

export interface EntryState {
  papierstauId: string;
  /** false: zurückgezogen (Papierstau hat den Eintrag nicht mehr geliefert) */
  published: boolean;
  /** SHA-256 über das kanonische JSON des Eintrags, wie Papierstau ihn beim letzten Übernehmen geliefert hat */
  sourceHash: string | null;
  /** Zeitpunkt des letzten Übernehmens (UTC) */
  syncedAt: string | null;
}

export const readState = async (strapi: Core.Strapi, scopes: Scope[]) => {
  const result: Partial<Record<Scope, EntryState[]>> = {};
  for (const scope of scopes) {
    const uid = UIDS[scope];
    const rows = await docs(strapi, uid).findMany({
      status: 'draft',
      fields: ['papierstauId', 'papierstauSync'],
      filters: { papierstauId: { $notNull: true } },
    });
    const published = await publishedIds(strapi, uid);
    result[scope] = rows
      .map((row: { documentId: string; papierstauId: string; papierstauSync?: Record<string, string> | null }) => ({
        papierstauId: row.papierstauId,
        published: published.has(row.documentId),
        sourceHash: row.papierstauSync?.sourceHash ?? null,
        syncedAt: row.papierstauSync?.syncedAt ?? null,
      }))
      .sort((a: EntryState, b: EntryState) => a.papierstauId.localeCompare(b.papierstauId));
  }
  return result;
};
