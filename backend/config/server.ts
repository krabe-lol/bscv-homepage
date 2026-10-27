import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 4081),
  app: {
    keys: env.array('APP_KEYS'),
  },
  // Öffentliche Adresse für absolute Links (z. B. Passwort-Reset), leer = http://localhost:PORT
  url: env('PUBLIC_URL', ''),
  // Hinter dem Webserver des Hosters: X-Forwarded-* vertrauen, sonst scheitert der Admin-Login an Secure-Cookies
  proxy: {
    koa: env.bool('IS_PROXIED', false),
    maxIpsCount: env.int('MAX_IPS_COUNT', 1),
  },
});

export default config;
