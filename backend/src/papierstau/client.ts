// Lesender Zugriff auf die externe API von Papierstau (Doku in Papierstau: docs/betrieb/externe-api.md).
// Der Schlüssel geht nur an den Rechner aus PAPIERSTAU_URL, nie an eine andere Adresse.

import { createHash } from 'crypto';

export interface PapierstauConfig {
  url: string;
  apiKey: string;
}

export interface PsContact {
  name: string | null;
  address: string | null;
  phone: string | null;
  mobile: string | null;
  fax: string | null;
  email: string | null;
}

export interface PsClub {
  id: string;
  name: string;
  website: string | null;
  founded: string | null;
  logoUrl: string | null;
  president: PsContact | null;
  mailingAddress: PsContact | null;
  driverCount: number;
  updatedAt: string;
}

export interface PsSeason {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  current: boolean;
}

export interface PsFile {
  id: string;
  name: string;
  mime: string;
  sizeBytes: number;
  sha256: string;
  url: string;
  updatedAt: string;
}

export interface PsEvent {
  id: string;
  date: string;
  entryDeadline: string | null;
  location: string | null;
  seasonId: string;
  seasonFinal: boolean;
  organizer: { name: string | null; clubId: string | null } | null;
  classes: string[];
  // Erst mit BSCV-21; fehlt das Feld, bleiben die Dokumente in Strapi unverändert
  documents?: PsFile[];
}

export interface PsClass {
  id: string;
  name: string;
}

export interface PsStandingRow {
  place: number;
  lastName: string;
  firstName: string;
  club: string;
  pointsPerEvent: Record<string, number>;
  total: number;
}

export interface PsStandings {
  raceClass: PsClass;
  season: { id: string; name: string };
  events: { id: string; date: string; location: string | null }[];
  rows: PsStandingRow[];
  // Erst mit BSCV-28
  pdf?: { source: 'generated' | 'uploaded'; sha256: string; updatedAt: string; url: string } | null;
}

export interface DownloadedFile {
  buffer: Buffer;
  mime: string;
  sha256: string;
}

/** Dateityp am Inhalt erkennen (Signatur der ersten Bytes); null, wenn es keiner der erlaubten Typen ist. */
export const sniffType = (buffer: Buffer): string | null => {
  const ascii = (start: number, end: number) => buffer.subarray(start, end).toString('latin1');
  if (ascii(0, 5) === '%PDF-') return 'application/pdf';
  if (buffer[0] === 0x89 && ascii(1, 4) === 'PNG') return 'image/png';
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (ascii(0, 4) === 'GIF8') return 'image/gif';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  return null;
};

const TIMEOUT_MS = 20_000;
const MAX_FILE_BYTES = 15 * 1024 * 1024;

export class PapierstauError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

/** Liest die Konfiguration; null, wenn der Abgleich nicht eingerichtet ist. Wirft bei unsicherer Adresse. */
export const readConfig = (raw: { url?: string; apiKey?: string } | undefined): PapierstauConfig | null => {
  const url = (raw?.url ?? '').trim().replace(/\/+$/, '');
  const apiKey = (raw?.apiKey ?? '').trim();
  if (!url || !apiKey) return null;
  const parsed = new URL(url);
  const local = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
  if (parsed.protocol !== 'https:' && !(local && parsed.protocol === 'http:')) {
    throw new PapierstauError('PAPIERSTAU_URL muss mit https:// beginnen (http:// nur für localhost).');
  }
  return { url, apiKey };
};

export const sha256 = (data: Buffer | string) => createHash('sha256').update(data).digest('hex');

export const createClient = (config: PapierstauConfig) => {
  const base = new URL(`${config.url}/`);

  // Pfade der API sind relativ zur Basis (z. B. "clubs") oder absolut auf demselben Rechner
  // (z. B. "/api/external/v1/clubs/…/logo"); alles andere wird abgelehnt.
  const resolve = (path: string) => {
    const target = new URL(path, base);
    if (target.origin !== base.origin) throw new PapierstauError(`Adresse außerhalb von Papierstau abgelehnt: ${target.origin}`);
    return target;
  };

  const request = async (path: string) => {
    const target = resolve(path);
    let res: Response;
    try {
      res = await fetch(target, {
        headers: { Authorization: `Bearer ${config.apiKey}`, Accept: 'application/json, */*' },
        redirect: 'error',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      throw new PapierstauError(`Papierstau nicht erreichbar (${target.pathname}): ${(err as Error).message}`);
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
      throw new PapierstauError(`Papierstau ${res.status} bei ${target.pathname}: ${body?.error?.message ?? res.statusText}`, res.status);
    }
    return res;
  };

  const get = async <T>(path: string): Promise<T> => (await request(path)).json() as Promise<T>;

  /** Lädt eine Datei; `allowed` sind erlaubte MIME-Typen. Der Fingerabdruck wird über den Inhalt gebildet. */
  const download = async (path: string, allowed: string[]): Promise<DownloadedFile> => {
    const res = await request(path);
    const mime = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
    if (!allowed.includes(mime)) throw new PapierstauError(`Unerwarteter Dateityp ${mime || '(leer)'} bei ${path}`);
    const length = Number(res.headers.get('content-length') ?? 0);
    if (length > MAX_FILE_BYTES) throw new PapierstauError(`Datei zu groß (${length} Bytes) bei ${path}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length > MAX_FILE_BYTES) throw new PapierstauError(`Datei zu groß (${buffer.length} Bytes) bei ${path}`);
    // Der Inhalt muss zum gemeldeten Typ passen; Strapi prüft das beim Ablegen aus dem Code nicht selbst
    const detected = sniffType(buffer);
    if (detected !== mime) throw new PapierstauError(`Inhalt (${detected ?? 'unbekannt'}) passt nicht zum Dateityp ${mime} bei ${path}`);
    return { buffer, mime, sha256: sha256(buffer) };
  };

  return {
    clubs: () => get<PsClub[]>('clubs'),
    seasons: () => get<PsSeason[]>('seasons'),
    events: (seasonId: string) => get<PsEvent[]>(`events?seasonId=${encodeURIComponent(seasonId)}`),
    classes: (seasonId: string) => get<PsClass[]>(`classes?seasonId=${encodeURIComponent(seasonId)}`),
    standings: (seasonId: string, classId: string) =>
      get<PsStandings>(`standings?seasonId=${encodeURIComponent(seasonId)}&classId=${encodeURIComponent(classId)}`),
    download,
  };
};

export type PapierstauClient = ReturnType<typeof createClient>;
