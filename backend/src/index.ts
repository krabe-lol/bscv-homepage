import type { Core } from '@strapi/strapi';
import sharp from 'sharp';

// Neue Vereine starten mit diesen Kennzahlen; der Wert wird später im CMS eingetragen,
// Kennzahlen ohne Wert blendet die Seite aus.
const CLUB_STAT_PRESETS = [
  { label: 'Gründungsjahr', value: null, icon: 'Flagge' },
  { label: 'Aktive Fahrer', value: null, icon: 'Auto' },
];

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    // Windows: der sharp-Cache hält die optimierten Temp-Dateien offen, dann scheitert das Aufräumen
    // im Upload mit EBUSY und die Medienbibliothek meldet 500, obwohl das Bild gespeichert ist.
    // Version von sharp in package.json muss zu der von @strapi/upload passen (gleiche Instanz).
    sharp.cache(false);
    // Bilder nacheinander statt auf allen Kernen gleichzeitig verkleinern: hält die Speicherspitze beim Upload klein
    sharp.concurrency(1);

    // Neuer Verein ohne Kennzahlen: Vorlagen eintragen
    strapi.documents.use((context, next) => {
      if (context.uid === 'api::club.club' && context.action === 'create') {
        const data = context.params.data as Record<string, unknown> | undefined;
        if (data && (!Array.isArray(data.stats) || data.stats.length === 0)) {
          data.stats = CLUB_STAT_PRESETS.map((stat) => ({ ...stat }));
        }
      }
      return next();
    });
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap(/* { strapi }: { strapi: Core.Strapi } */) {},
};
