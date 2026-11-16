// Abgleich Papierstau → Strapi. Papierstau ist die Quelle für Vereine, Renntermine und Punktewertung;
// übernommene Einträge werden sofort veröffentlicht. Felder, die die Redaktion pflegt (Fotos, Texte, Farben,
// Strecke und Titel der Rennen), bleiben unangetastet. Zugeordnet wird über papierstauId; beim ersten Abgleich
// Vereine über den Namen und Rennen über das Datum. Was in Papierstau fehlt, wird zurückgezogen (nicht gelöscht).

import type { Core } from '@strapi/strapi';
import {
  createClient,
  readConfig,
  type PapierstauClient,
  type PsClub,
  type PsEvent,
  type PsSeason,
} from './client';
import {
  contact,
  defaultEventTitle,
  eventFields,
  fingerprint,
  mergeStats,
  normalizeName,
  standingTable,
  website,
} from './map';
import { createMedia, type Media } from './media';

export type Scope = 'clubs' | 'events' | 'standings';
export const SCOPES: Scope[] = ['clubs', 'events', 'standings'];

const CLUB = 'api::club.club';
const EVENT = 'api::event.event';
const STANDING = 'api::standing.standing';
export const UIDS: Record<Scope, string> = { clubs: CLUB, events: EVENT, standings: STANDING };

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const DOCUMENT_TYPES = ['application/pdf', ...IMAGE_TYPES];

/** Ergebnis eines Bereichs; `failures` nennt die Einträge, die nicht übernommen werden konnten. */
export interface Counts {
  created: number;
  updated: number;
  unchanged: number;
  unpublished: number;
  failed: number;
  failures: { papierstauId: string; message: string }[];
}

export interface ScopeResult extends Counts {
  /** Gesetzt, wenn der Bereich abgebrochen wurde (z. B. Papierstau nicht erreichbar); dann wurde nichts zurückgezogen. */
  error?: string;
}

const emptyCounts = (): Counts => ({ created: 0, updated: 0, unchanged: 0, unpublished: 0, failed: 0, failures: [] });

const MAX_FAILURES = 100;

const fail = (counts: Counts, papierstauId: string, message: string) => {
  counts.failed++;
  if (counts.failures.length < MAX_FAILURES) counts.failures.push({ papierstauId, message });
};

const now = () => new Date().toISOString();

interface Context {
  strapi: Core.Strapi;
  client: PapierstauClient;
  media: Media;
  seasons?: PsSeason[];
}

// Die Typen der Document Service API hängen an generierten Typen; hier reicht der lose Zugriff.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const docs = (strapi: Core.Strapi, uid: string) => strapi.documents(uid as any) as any;

// Gelesene Einträge: nur die Felder, die der Abgleich braucht
interface Doc {
  documentId: string;
  papierstauId?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  papierstauSync?: any;
  name?: string;
  date?: string;
  stats?: { id: number; label: string; value?: string | null; icon?: string | null }[];
}

const findDrafts = async (strapi: Core.Strapi, uid: string, params: object): Promise<Doc[]> =>
  docs(strapi, uid).findMany({ status: 'draft', ...params });

const log = (strapi: Core.Strapi) => ({
  info: (msg: string) => strapi.log.info(`[papierstau] ${msg}`),
  warn: (msg: string) => strapi.log.warn(`[papierstau] ${msg}`),
  error: (msg: string) => strapi.log.error(`[papierstau] ${msg}`),
});

export const publishedIds = async (strapi: Core.Strapi, uid: string) => {
  const rows = await docs(strapi, uid).findMany({ status: 'published', fields: ['documentId'] });
  return new Set<string>(rows.map((r: { documentId: string }) => r.documentId));
};

const seasonsOf = async (ctx: Context) => (ctx.seasons ??= await ctx.client.seasons());

/** Zieht Einträge zurück, die Papierstau nicht mehr liefert. Liefert Papierstau gar nichts, wird nichts zurückgezogen. */
const unpublishMissing = async (
  ctx: Context,
  uid: string,
  label: string,
  synced: Doc[],
  seen: Set<string>,
  published: Set<string>,
  counts: Counts,
) => {
  const missing = synced.filter((d) => !seen.has(d.papierstauId) && published.has(d.documentId));
  if (!missing.length) return;
  if (!seen.size) {
    log(ctx.strapi).warn(`${label}: Papierstau liefert keine Einträge, ${missing.length} bleiben sicherheitshalber veröffentlicht.`);
    return;
  }
  for (const doc of missing) {
    await docs(ctx.strapi, uid).unpublish({ documentId: doc.documentId });
    counts.unpublished++;
  }
};

// ---------------------------------------------------------------- Vereine

const syncClubs = async (ctx: Context): Promise<Counts> => {
  const { strapi, client, media } = ctx;
  const counts = emptyCounts();
  const items: PsClub[] = await client.clubs();
  const existing = await findDrafts(strapi, CLUB, {
    fields: ['name', 'papierstauId', 'papierstauSync'],
    populate: { stats: true },
  });
  const published = await publishedIds(strapi, CLUB);

  const byId = new Map(existing.filter((c) => c.papierstauId).map((c) => [c.papierstauId, c]));
  // Erste Zuordnung über den Namen, nur wenn er eindeutig ist
  const byName = new Map<string, Doc | null>();
  for (const c of existing.filter((c) => !c.papierstauId)) {
    const key = normalizeName(c.name);
    byName.set(key, byName.has(key) ? null : c);
  }

  const seen = new Set<string>();
  for (const club of items) {
    seen.add(club.id);
    const warn = (msg: string) => log(strapi).warn(`Verein „${club.name}“: ${msg}`);
    let added: number | null = null;
    try {
      let doc = byId.get(club.id);
      if (!doc) {
        const key = normalizeName(club.name);
        doc = byName.get(key) ?? undefined;
        if (doc) byName.delete(key);
      }
      const sync = doc?.papierstauSync ?? {};
      const hash = fingerprint(club);
      if (doc && sync.hash === hash && published.has(doc.documentId)) {
        counts.unchanged++;
        continue;
      }

      // Logo: nur bei geändertem Inhalt neu ablegen. Ohne Logo in Papierstau bleibt ein von Hand gepflegtes stehen.
      let logoHash: string | null = sync.logoHash ?? null;
      let logoFileId: number | null = sync.logoFileId ?? null;
      const logo: { logo?: number | null } = {};
      let oldLogo: number | null = null;
      if (club.logoUrl) {
        const file = await client.download(club.logoUrl, IMAGE_TYPES);
        if (file.sha256 !== logoHash || !(await media.exists(logoFileId))) {
          added = await media.add(file, `${club.name} Logo`, `Logo ${club.name}`);
          oldLogo = logoFileId;
          logo.logo = added;
          logoHash = file.sha256;
          logoFileId = added;
        }
      } else if (logoFileId) {
        logo.logo = null;
        oldLogo = logoFileId;
        logoHash = null;
        logoFileId = null;
      }

      const data = {
        papierstauId: club.id,
        name: club.name.trim(),
        website: website(club.website, warn),
        president: contact(club.president, warn),
        mailingAddress: contact(club.mailingAddress, warn),
        stats: mergeStats(doc?.stats, club.founded, club.driverCount),
        papierstauSync: { hash, sourceHash: hash, syncedAt: now(), logoHash, logoFileId },
        ...logo,
      };
      if (doc) {
        await docs(strapi, CLUB).update({ documentId: doc.documentId, data, status: 'published' });
        counts.updated++;
      } else {
        await docs(strapi, CLUB).create({ data, status: 'published' });
        counts.created++;
      }
      added = null;
      await media.remove(oldLogo);
    } catch (err) {
      fail(counts, club.id, (err as Error).message);
      log(strapi).error(`Verein „${club.name}“ (${club.id}): ${(err as Error).message}`);
      await media.remove(added).catch(() => undefined);
    }
  }

  const synced = existing.filter((c) => c.papierstauId);
  await unpublishMissing(ctx, CLUB, 'Vereine', synced, seen, published, counts);
  return counts;
};

// ---------------------------------------------------------------- Renntermine

const syncEvents = async (ctx: Context): Promise<Counts> => {
  const { strapi, client, media } = ctx;
  const counts = emptyCounts();
  const items: PsEvent[] = [];
  for (const season of await seasonsOf(ctx)) items.push(...(await client.events(season.id)));

  // Veranstalter: nur Vereine, die auf bscv.de veröffentlicht sind
  const clubs: Doc[] = await docs(strapi, CLUB).findMany({ status: 'published', fields: ['papierstauId'] });
  const clubDocument = new Map<string, string>(
    clubs.filter((c) => c.papierstauId).map((c) => [c.papierstauId, c.documentId]),
  );

  const existing = await findDrafts(strapi, EVENT, {
    fields: ['title', 'date', 'papierstauId', 'papierstauSync'],
  });
  const published = await publishedIds(strapi, EVENT);
  const byId = new Map(existing.filter((e) => e.papierstauId).map((e) => [e.papierstauId, e]));
  // Erste Zuordnung über das Datum, nur wenn es an dem Tag auf beiden Seiten genau ein Rennen gibt
  const unmatched = existing.filter((e) => !e.papierstauId);
  const sameDay = (date: string) => items.filter((i) => i.date === date).length;

  const seen = new Set<string>();
  for (const event of items) {
    seen.add(event.id);
    const name = `Rennen am ${event.date} (${event.location ?? event.organizer?.name ?? event.id})`;
    const warn = (msg: string) => log(strapi).warn(`${name}: ${msg}`);
    const added: number[] = [];
    try {
      let doc = byId.get(event.id);
      if (!doc && sameDay(event.date) === 1) {
        const candidates = unmatched.filter((e) => e.date === event.date);
        if (candidates.length === 1) {
          doc = candidates[0];
          unmatched.splice(unmatched.indexOf(doc), 1);
        }
      }
      const organizer = event.organizer?.clubId ? (clubDocument.get(event.organizer.clubId) ?? null) : null;
      const sync = doc?.papierstauSync ?? {};
      const hash = fingerprint({ event, organizer });
      if (doc && sync.hash === hash && published.has(doc.documentId)) {
        counts.unchanged++;
        continue;
      }

      // Dokumente (Ausschreibungen): erst mit BSCV-21 in der API, bis dahin bleibt das Feld unverändert
      let files: Record<string, { sha256: string; fileId: number }> = sync.files ?? {};
      const documents: { documents?: number[] } = {};
      let obsolete: number[] = [];
      if (Array.isArray(event.documents)) {
        const next: typeof files = {};
        for (const d of event.documents) {
          const prev = files[d.id];
          if (prev && prev.sha256 === d.sha256 && (await media.exists(prev.fileId))) {
            next[d.id] = prev;
            continue;
          }
          const file = await client.download(d.url, DOCUMENT_TYPES);
          if (file.sha256 !== d.sha256) warn(`Fingerabdruck von „${d.name}“ weicht von der Angabe in Papierstau ab.`);
          const id = await media.add(file, d.name);
          added.push(id);
          next[d.id] = { sha256: d.sha256, fileId: id };
        }
        const kept = new Set(Object.values(next).map((f) => f.fileId));
        obsolete = Object.values(files)
          .map((f) => f.fileId)
          .filter((id) => !kept.has(id));
        files = next;
        documents.documents = event.documents.map((d) => next[d.id].fileId);
      }

      const data = {
        ...eventFields(event, organizer),
        ...documents,
        papierstauId: event.id,
        papierstauSync: { hash, sourceHash: fingerprint(event), syncedAt: now(), files },
      };
      if (doc) {
        await docs(strapi, EVENT).update({ documentId: doc.documentId, data, status: 'published' });
        counts.updated++;
      } else {
        await docs(strapi, EVENT).create({ data: { ...data, title: defaultEventTitle(event) }, status: 'published' });
        counts.created++;
      }
      added.length = 0;
      for (const id of obsolete) await media.remove(id);
    } catch (err) {
      fail(counts, event.id, (err as Error).message);
      log(strapi).error(`${name}: ${(err as Error).message}`);
      for (const id of added) await media.remove(id).catch(() => undefined);
    }
  }

  const synced = existing.filter((e) => e.papierstauId);
  await unpublishMissing(ctx, EVENT, 'Renntermine', synced, seen, published, counts);
  return counts;
};

// ---------------------------------------------------------------- Punktewertung

const syncStandings = async (ctx: Context): Promise<Counts> => {
  const { strapi, client, media } = ctx;
  const counts = emptyCounts();
  const existing = await findDrafts(strapi, STANDING, { fields: ['papierstauId', 'papierstauSync'] });
  const published = await publishedIds(strapi, STANDING);
  const byId = new Map(existing.filter((s) => s.papierstauId).map((s) => [s.papierstauId, s]));

  const seen = new Set<string>();
  for (const season of await seasonsOf(ctx)) {
    const classes = await client.classes(season.id);
    for (const [position, raceClass] of classes.entries()) {
      const standings = await client.standings(season.id, raceClass.id);
      const pdf = standings.pdf ?? null;
      // Klassen ohne Starter und ohne PDF erscheinen nicht
      if (!standings.rows.length && !pdf) continue;

      const papierstauId = `${season.id}:${raceClass.id}`;
      const label = `Wertung ${season.name} ${raceClass.name}`;
      seen.add(papierstauId);
      let added: number | null = null;
      try {
        const doc = byId.get(papierstauId);
        const sync = doc?.papierstauSync ?? {};
        const table = standingTable(standings);
        const hash = fingerprint({ table, season, raceClass, position, pdf: pdf?.sha256 ?? null });
        if (doc && sync.hash === hash && published.has(doc.documentId)) {
          counts.unchanged++;
          continue;
        }

        let pdfState: { sha256: string; fileId: number } | null = sync.pdf ?? null;
        let old: number | null = null;
        if (pdf && !(pdfState?.sha256 === pdf.sha256 && (await media.exists(pdfState.fileId)))) {
          const file = await client.download(pdf.url, ['application/pdf']);
          added = await media.add(file, `Punktewertung ${season.name} ${raceClass.name}`);
          old = pdfState?.fileId ?? null;
          pdfState = { sha256: pdf.sha256, fileId: added };
        } else if (!pdf && pdfState) {
          old = pdfState.fileId;
          pdfState = null;
        }

        const data = {
          papierstauId,
          title: raceClass.name,
          className: raceClass.name,
          season: season.name,
          seasonStart: season.startDate,
          position,
          table,
          pdf: pdfState?.fileId ?? null,
          papierstauSync: { hash, sourceHash: fingerprint(standings), syncedAt: now(), pdf: pdfState },
        };
        if (doc) {
          await docs(strapi, STANDING).update({ documentId: doc.documentId, data, status: 'published' });
          counts.updated++;
        } else {
          await docs(strapi, STANDING).create({ data, status: 'published' });
          counts.created++;
        }
        added = null;
        await media.remove(old);
      } catch (err) {
        fail(counts, papierstauId, (err as Error).message);
        log(strapi).error(`${label}: ${(err as Error).message}`);
        await media.remove(added).catch(() => undefined);
      }
    }
  }

  const synced = existing.filter((s) => s.papierstauId);
  await unpublishMissing(ctx, STANDING, 'Punktewertung', synced, seen, published, counts);
  return counts;
};

// ---------------------------------------------------------------- Ablauf

const STEPS: Record<Scope, { label: string; run: (ctx: Context) => Promise<Counts> }> = {
  clubs: { label: 'Vereine', run: syncClubs },
  events: { label: 'Renntermine', run: syncEvents },
  standings: { label: 'Punktewertung', run: syncStandings },
};

export const isConfigured = (strapi: Core.Strapi) => {
  try {
    return readConfig(strapi.config.get('papierstau')) !== null;
  } catch {
    return false;
  }
};

/** Ein Abgleich der genannten Bereiche, immer in der Reihenfolge Vereine → Renntermine → Punktewertung. */
export const runSync = async (strapi: Core.Strapi, scopes: Iterable<Scope>, reason: string) => {
  const wanted = SCOPES.filter((s) => new Set(scopes).has(s));
  const results: Partial<Record<Scope, ScopeResult>> = {};
  const config = readConfig(strapi.config.get('papierstau'));
  if (!config) {
    const error = 'PAPIERSTAU_URL oder PAPIERSTAU_API_KEY fehlt.';
    log(strapi).warn(`Abgleich übersprungen: ${error}`);
    for (const scope of wanted) results[scope] = { ...emptyCounts(), error };
    return results;
  }
  const ctx: Context = { strapi, client: createClient(config), media: createMedia(strapi) };
  log(strapi).info(`Abgleich gestartet (${reason}): ${wanted.join(', ')}`);
  for (const scope of wanted) {
    const { label, run } = STEPS[scope];
    try {
      const c = await run(ctx);
      results[scope] = c;
      log(strapi).info(
        `${label}: ${c.created} neu, ${c.updated} geändert, ${c.unchanged} unverändert, ${c.unpublished} zurückgezogen, ${c.failed} fehlgeschlagen`,
      );
    } catch (err) {
      // Liste nicht ladbar: nichts zurückziehen, der nächste Abgleich holt es nach
      const error = (err as Error).message;
      results[scope] = { ...emptyCounts(), error };
      log(strapi).error(`${label}: Abgleich abgebrochen: ${error}`);
    }
  }
  return results;
};
