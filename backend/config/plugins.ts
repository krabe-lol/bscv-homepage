import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
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
