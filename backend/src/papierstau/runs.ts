// Läufe des Abgleichs: Warteschlange (nie zwei gleichzeitig) und Status für Papierstau (GET /api/papierstau/runs).
// Anstöße während eines Laufs werden zu einem wartenden Lauf zusammengefasst. Die letzten Läufe stehen im
// Core-Store, damit der Status einen Neustart übersteht.

import { randomUUID } from 'crypto';
import type { Core } from '@strapi/strapi';
import { runSync, SCOPES, type Scope, type ScopeResult } from './sync';

export type RunStatus = 'queued' | 'running' | 'succeeded' | 'partial' | 'failed';

export interface Run {
  id: string;
  status: RunStatus;
  reason: string;
  scopes: Scope[];
  requestedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  results: Partial<Record<Scope, ScopeResult>>;
}

const KEEP = 20;
const STORE = { type: 'api', name: 'papierstau', key: 'runs' };

let current: Run | null = null;
let queued: Run | null = null;
let history: Run[] | null = null;

const now = () => new Date().toISOString();
const ordered = (scopes: Iterable<Scope>) => SCOPES.filter((s) => new Set(scopes).has(s));

// succeeded: alles übernommen; partial: einzelne Einträge fehlgeschlagen; failed: ein Bereich abgebrochen
const statusOf = (results: Run['results']): RunStatus => {
  const list = Object.values(results);
  if (list.some((r) => r.error)) return 'failed';
  if (list.some((r) => r.failed > 0)) return 'partial';
  return 'succeeded';
};

const loadHistory = async (strapi: Core.Strapi) => {
  if (!history) {
    const stored = (await strapi.store.get(STORE)) as Run[] | null;
    history = Array.isArray(stored) ? stored : [];
  }
  return history;
};

const remember = async (strapi: Core.Strapi, run: Run) => {
  const list = await loadHistory(strapi);
  history = [run, ...list.filter((r) => r.id !== run.id)].slice(0, KEEP);
  await strapi.store.set({ ...STORE, value: history });
};

const work = (strapi: Core.Strapi, first: Run) => {
  current = first;
  (async () => {
    let run: Run | null = first;
    while (run) {
      current = run;
      run.status = 'running';
      run.startedAt = now();
      try {
        run.results = await runSync(strapi, run.scopes, run.reason);
        run.status = statusOf(run.results);
      } catch (err) {
        run.status = 'failed';
        strapi.log.error(`[papierstau] Abgleich fehlgeschlagen: ${(err as Error).message}`);
      }
      run.finishedAt = now();
      await remember(strapi, run).catch((err) =>
        strapi.log.error(`[papierstau] Status des Abgleichs nicht gespeichert: ${(err as Error).message}`),
      );
      run = queued;
      queued = null;
    }
  })().finally(() => {
    current = null;
  });
};

/** Stößt einen Abgleich an und gibt den Lauf zurück, der ihn ausführt (läuft schon einer, den wartenden). */
export const requestSync = (strapi: Core.Strapi, scopes: Iterable<Scope>, reason: string): Run => {
  if (queued) {
    queued.scopes = ordered([...queued.scopes, ...scopes]);
    if (!queued.reason.split(', ').includes(reason)) queued.reason += `, ${reason}`;
    return queued;
  }
  const run: Run = {
    id: randomUUID(),
    status: 'queued',
    reason,
    scopes: ordered(scopes),
    requestedAt: now(),
    startedAt: null,
    finishedAt: null,
    results: {},
  };
  if (current) queued = run;
  else work(strapi, run);
  return run;
};

/** Laufende und wartende zuerst, danach die gespeicherten, neueste zuerst. */
export const listRuns = async (strapi: Core.Strapi, limit = KEEP) => {
  const stored = await loadHistory(strapi);
  const active = [queued, current].filter((r): r is Run => r !== null);
  return [...active, ...stored.filter((r) => !active.some((a) => a.id === r.id))].slice(0, limit);
};

export const findRun = async (strapi: Core.Strapi, id: string) =>
  (await listRuns(strapi, KEEP + 2)).find((r) => r.id === id) ?? null;
