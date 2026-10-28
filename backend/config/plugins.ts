import path from 'path';
import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  // Ansichten im Content-Manager (Feldnamen, Reihenfolge, Listenspalten) und die Rechte der Rollen Public und
  // Authenticated liegen in der Datenbank. Lokal unter Einstellungen → Config Sync exportieren, dann landen sie als
  // JSON in config/sync und kommen mit dem Deploy auf den Server; dort spielt Strapi sie bei jedem Start ein
  // (lokal nie, das Plugin ignoriert importOnBootstrap in der Entwicklung). Was live geändert wird, geht dabei verloren.
  'config-sync': {
    config: {
      // Absolut, weil das Plugin relative Pfade vom Arbeitsverzeichnis aus auflöst; diese Datei läuft aus dist/config
      syncDir: path.join(__dirname, '..', '..', 'config', 'sync') + path.sep,
      importOnBootstrap: true,
      // Admin-Rollen und Sprachen bleiben, wie sie auf dem Server sind
      excludedTypes: ['admin-role', 'i18n-locale'],
      // Vom Core-Store nur die Ansichten (plugin_content_manager_configuration_*); der Rest sind Einstellungen des
      // Servers (Upload, Mails, Login-Anbieter mit Secrets) oder interne Werte von Strapi
      excludedConfig: [
        'core-store.core_',
        'core-store.ee_',
        'core-store.plugin_i18n',
        'core-store.plugin_upload',
        'core-store.plugin_users-permissions',
        'core-store.strapi_',
      ],
    },
  },
  upload: {
    config: {
      // Große Fotos brauchen beim Verkleinern viel Arbeitsspeicher, auf dem Webhosting sind es nur 384 MB
      sizeLimit: env.int('UPLOAD_SIZE_LIMIT_MB', 20) * 1024 * 1024,
    },
  },
  // Mails (z. B. „Passwort vergessen“ im Admin) per SMTP, sobald SMTP_HOST gesetzt ist; sonst Strapi-Standard (sendmail)
  ...(env('SMTP_HOST') && {
    email: {
      config: {
        provider: 'nodemailer',
        providerOptions: {
          host: env('SMTP_HOST'),
          port: env.int('SMTP_PORT', 587),
          secure: env.int('SMTP_PORT', 587) === 465,
          auth: { user: env('SMTP_USERNAME'), pass: env('SMTP_PASSWORD') },
        },
        settings: {
          defaultFrom: env('SMTP_FROM', env('SMTP_USERNAME')),
          defaultReplyTo: env('SMTP_FROM', env('SMTP_USERNAME')),
        },
      },
    },
  }),
});

export default config;
