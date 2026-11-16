import type { Core } from '@strapi/strapi';
import { requestSync } from '../src/papierstau/runs';
import { isConfigured, SCOPES } from '../src/papierstau/sync';

// Nächtlicher Abgleich mit Papierstau, falls ein Anstoß aus Papierstau verloren gegangen ist
export default {
  papierstauNightly: {
    task: async ({ strapi }: { strapi: Core.Strapi }) => {
      if (isConfigured(strapi)) requestSync(strapi, SCOPES, 'nächtlicher Abgleich');
    },
    options: { rule: '0 3 * * *', tz: 'Europe/Berlin' },
  },
};
