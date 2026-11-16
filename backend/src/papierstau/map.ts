// Reine Funktionen: Daten aus Papierstau in Felder von Strapi übersetzen.

import { sha256, type PsContact, type PsEvent, type PsStandings } from './client';

// Wie die Regex am Feld website von api::club.club, sonst lehnt Strapi den Eintrag ab
const WEBSITE = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(:\d+)?(\/[^\s]*)?$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const FOUNDED_LABEL = 'Gründungsjahr';
export const DRIVERS_LABEL = 'Aktive Fahrer';
const STAT_ICONS: Record<string, string> = { [FOUNDED_LABEL]: 'Flagge', [DRIVERS_LABEL]: 'Auto' };

export interface Warn {
  (message: string): void;
}

const clean = (value: string | null | undefined) => {
  const text = value?.trim();
  return text ? text : null;
};

/** Vereinsnamen vergleichbar machen (für die erste Zuordnung ohne Papierstau-ID). */
export const normalizeName = (name: string | null | undefined) =>
  (name ?? '').toLocaleLowerCase('de').replace(/[^a-z0-9äöüß]/g, '');

export const website = (value: string | null, warn: Warn) => {
  const url = clean(value);
  if (!url) return null;
  if (WEBSITE.test(url)) return url;
  warn(`Website „${url}“ ist ungültig und wird nicht übernommen.`);
  return null;
};

/** Papierstau führt die Adresse als eine Zeile („Rennweg 1, 12345 Musterstadt“), Strapi trennt Straße und Ort. */
export const splitAddress = (value: string | null) => {
  const text = clean(value)?.replace(/\s*\n\s*/g, ', ');
  if (!text) return null;
  const match = text.match(/^(.*?)[,\s]*(\b\d{5}\s+\S.*)$/);
  if (match) return { street: clean(match[1]), city: clean(match[2]) };
  return { street: text, city: null };
};

export const contact = (value: PsContact | null, warn: Warn) => {
  if (!value) return null;
  const email = clean(value.email);
  if (email && !EMAIL.test(email)) warn(`E-Mail „${email}“ ist ungültig und wird nicht übernommen.`);
  const result = {
    name: clean(value.name),
    address: splitAddress(value.address),
    phone: clean(value.phone),
    mobile: clean(value.mobile),
    fax: clean(value.fax),
    email: email && EMAIL.test(email) ? email : null,
  };
  return Object.values(result).some((v) => v !== null) ? result : null;
};

interface Stat {
  id?: number;
  label: string;
  value?: string | null;
  icon?: string | null;
}

/** Setzt Gründungsjahr und Aktive Fahrer, alle übrigen Kennzahlen pflegt die Redaktion und bleiben unverändert. */
export const mergeStats = (existing: Stat[] | null | undefined, founded: string | null, driverCount: number) => {
  const values: Record<string, string | null> = {
    [FOUNDED_LABEL]: clean(founded),
    [DRIVERS_LABEL]: String(driverCount ?? 0),
  };
  const stats = (existing ?? []).map(({ id, label, value, icon }) => ({ id, label, value: value ?? null, icon }));
  for (const label of Object.keys(values)) {
    const stat = stats.find((s) => s.label === label);
    if (stat) stat.value = values[label];
    else stats.push({ id: undefined, label, value: values[label], icon: STAT_ICONS[label] });
  }
  return stats.map(({ id, ...rest }) => (id ? { id, ...rest } : rest));
};

export const eventFields = (event: PsEvent, organizerDocumentId: string | null) => ({
  date: event.date,
  entryDeadline: event.entryDeadline ?? null,
  location: clean(event.location),
  seasonFinal: Boolean(event.seasonFinal),
  classes: event.classes ?? [],
  organizer: organizerDocumentId,
  organizerName: organizerDocumentId ? null : clean(event.organizer?.name),
});

/** Titel neuer Rennen; danach pflegt ihn die Redaktion. */
export const defaultEventTitle = (event: PsEvent) => clean(event.location) ?? clean(event.organizer?.name) ?? 'Rennen';

export const standingTable = (standings: PsStandings) => ({
  events: standings.events.map(({ id, date, location }) => ({ id, date, location: location ?? null })),
  rows: standings.rows.map(({ place, lastName, firstName, club, pointsPerEvent, total }) => ({
    place,
    lastName,
    firstName,
    club,
    pointsPerEvent,
    total,
  })),
});

/**
 * Kanonisches JSON: Objektschlüssel rekursiv sortiert (Standardsortierung von JavaScript), Arrays in ihrer Reihenfolge,
 * ohne Leerzeichen, Felder mit undefined entfallen. Papierstau bildet denselben Text über seine API-Antwort.
 */
export const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map((v) => (v === undefined ? 'null' : canonicalJson(v))).join(',')}]`;
  const record = value as Record<string, unknown>;
  const entries = Object.keys(record)
    .filter((k) => record[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonicalJson(record[k])}`);
  return `{${entries.join(',')}}`;
};

/**
 * Fingerabdruck: SHA-256 (hex) über das kanonische JSON in UTF-8. Gleich → kein Schreiben, damit updatedAt nur bei
 * echten Änderungen springt. Über die rohen Daten aus Papierstau gebildet, ist es der `sourceHash`, den
 * GET /api/papierstau/state zurückgibt.
 */
export const fingerprint = (value: unknown) => sha256(canonicalJson(value));
