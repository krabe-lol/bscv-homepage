import type { Core } from '@strapi/strapi';

// Abgleich mit Papierstau (Vereine, Renntermine, Punktewertung). Ohne URL und Schlüssel ist er aus.
// url: Basisadresse der externen API, z. B. https://papierstau.example.org/api/external/v1
// apiKey: API-Schlüssel aus Papierstau (Admin → API-Schlüssel, beginnt mit pak_)
// syncToken: Token, mit dem Papierstau den Abgleich anstößt (POST /api/papierstau/sync), mindestens 32 Zeichen
const config = ({ env }: Core.Config.Shared.ConfigParams) => ({
  url: env('PAPIERSTAU_URL', ''),
  apiKey: env('PAPIERSTAU_API_KEY', ''),
  syncToken: env('PAPIERSTAU_SYNC_TOKEN', ''),
});

export default config;
