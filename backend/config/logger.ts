import type { Core } from '@strapi/strapi';

// In Produktion keine Zeile pro Anfrage (Level „http“), sonst wächst das Log auf dem Webhosting schnell;
// Start/Stopp, Warnungen und Fehler bleiben. Überschreibbar mit LOG_LEVEL, z. B. LOG_LEVEL=http zur Fehlersuche.
const config = ({ env }: Core.Config.Shared.ConfigParams) => ({
  level: env('LOG_LEVEL', env('NODE_ENV') === 'production' ? 'info' : 'http'),
});

export default config;
