// Schnittstelle für Papierstau: POST /sync, GET /runs, GET /runs/:id, GET /state (alle mit Token).
// Ausführlich beschrieben in PAPIERSTAU-API.md im Root des Repos. Änderungen hier dort im selben Commit nachziehen.

import { createHash, timingSafeEqual } from 'crypto';
import type { Core } from '@strapi/strapi';
import { findRun, listRuns, requestSync } from '../../../papierstau/runs';
import { readState } from '../../../papierstau/state';
import { isConfigured, SCOPES, type Scope } from '../../../papierstau/sync';

const MIN_TOKEN_LENGTH = 32;

const digest = (value: string) => createHash('sha256').update(value).digest();

// Vergleich in konstanter Zeit, auch bei unterschiedlicher Länge
const tokenMatches = (given: string, expected: string) => timingSafeEqual(digest(given), digest(expected));

const error = (ctx, status: number, code: string, message: string) => {
  ctx.status = status;
  ctx.body = { error: { code, message } };
};

const isScopeList = (value: unknown): value is Scope[] =>
  Array.isArray(value) && value.every((s) => SCOPES.includes(s));

export default ({ strapi }: { strapi: Core.Strapi }) => {
  /** Prüft Einrichtung und Token; schreibt bei Fehlern die Antwort und liefert false. */
  const authorized = (ctx) => {
    const expected = String(strapi.config.get('papierstau.syncToken') ?? '');
    if (expected.length < MIN_TOKEN_LENGTH || !isConfigured(strapi)) {
      error(ctx, 503, 'not_configured', 'Der Abgleich mit Papierstau ist nicht eingerichtet.');
      return false;
    }
    const header = String(ctx.request.headers.authorization ?? '');
    const given = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!given || !tokenMatches(given, expected)) {
      error(ctx, 401, 'unauthenticated', 'Der Token fehlt oder ist ungültig.');
      return false;
    }
    return true;
  };

  return {
    async sync(ctx) {
      if (!authorized(ctx)) return;
      const raw = ctx.request.body?.scopes;
      if (raw !== undefined && !isScopeList(raw)) {
        return error(ctx, 422, 'invalid_input', `scopes darf nur ${SCOPES.join(', ')} enthalten.`);
      }
      const run = requestSync(strapi, raw?.length ? raw : SCOPES, 'Anstoß aus Papierstau');
      ctx.status = 202;
      ctx.body = { accepted: true, runId: run.id, status: run.status, scopes: run.scopes };
    },

    async runs(ctx) {
      if (!authorized(ctx)) return;
      const limit = ctx.query.limit === undefined ? 20 : Number(ctx.query.limit);
      if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
        return error(ctx, 422, 'invalid_input', 'limit muss eine ganze Zahl von 1 bis 20 sein.');
      }
      ctx.body = await listRuns(strapi, limit);
    },

    async run(ctx) {
      if (!authorized(ctx)) return;
      const run = await findRun(strapi, String(ctx.params.id));
      if (!run) return error(ctx, 404, 'not_found', 'Diesen Lauf gibt es nicht (mehr).');
      ctx.body = run;
    },

    async state(ctx) {
      if (!authorized(ctx)) return;
      const raw = ctx.query.scope;
      const scopes = raw === undefined ? SCOPES : String(raw).split(',').map((s) => s.trim());
      if (!isScopeList(scopes) || scopes.length === 0) {
        return error(ctx, 422, 'invalid_input', `scope darf nur ${SCOPES.join(', ')} enthalten.`);
      }
      ctx.body = { generatedAt: new Date().toISOString(), ...(await readState(strapi, scopes)) };
    },
  };
};
