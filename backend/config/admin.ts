import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Admin => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  secrets: {
    encryptionKey: env('ENCRYPTION_KEY'),
  },
  flags: {
    // Keine Umfragen und keine Werbung für die Bezahlversion im Admin
    nps: env.bool('FLAG_NPS', false),
    promoteEE: env.bool('FLAG_PROMOTE_EE', false),
  },
  // Deutsche Fassung der Mail „Passwort vergessen“ (Standard ist Englisch); <%= url %> ist der Link zum Zurücksetzen.
  // Strapi erwartet { subject, text, html }, die Typen sagen fälschlich string.
  forgotPassword: {
    emailTemplate: {
      subject: 'BSCV-CMS: Passwort zurücksetzen',
      text: `Hallo <%= user.firstname %>,

für dein Konto im BSCV-CMS wurde ein neues Passwort angefordert. Über diesen Link kannst du es festlegen:

<%= url %>

Wenn du das nicht warst, kannst du diese Mail ignorieren; dein bisheriges Passwort bleibt gültig.`,
      html: `<p>Hallo <%= user.firstname %>,</p>
<p>für dein Konto im BSCV-CMS wurde ein neues Passwort angefordert. Über diesen Link kannst du es festlegen:</p>
<p><a href="<%= url %>"><%= url %></a></p>
<p>Wenn du das nicht warst, kannst du diese Mail ignorieren; dein bisheriges Passwort bleibt gültig.</p>`,
    } as unknown as string,
  },
});

export default config;
