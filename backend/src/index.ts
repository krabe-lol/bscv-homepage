// import type { Core } from '@strapi/strapi';
import sharp from 'sharp';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {
    // Windows: der sharp-Cache hält die optimierten Temp-Dateien offen, dann scheitert das Aufräumen
    // im Upload mit EBUSY und die Medienbibliothek meldet 500, obwohl das Bild gespeichert ist.
    // Version von sharp in package.json muss zu der von @strapi/upload passen (gleiche Instanz).
    sharp.cache(false);
    // Bilder nacheinander statt auf allen Kernen gleichzeitig verkleinern: hält die Speicherspitze beim Upload klein
    sharp.concurrency(1);
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
