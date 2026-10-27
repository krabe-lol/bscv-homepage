import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Middlewares => [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  // Nur das eigene Frontend darf die API aus dem Browser abfragen (Standard wäre jede Seite, mit Cookies)
  {
    name: 'strapi::cors',
    config: { origin: env.array('CORS_ORIGIN', ['http://localhost:4080']) },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

export default config;
