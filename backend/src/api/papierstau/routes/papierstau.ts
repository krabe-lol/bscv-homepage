// Schnittstelle für Papierstau, beschrieben in PAPIERSTAU-API.md (bei Änderungen nachziehen). Ohne Benutzeranmeldung, der Controller prüft den Token selbst.
const route = (method: 'GET' | 'POST', path: string, handler: string) => ({
  method,
  path,
  handler: `papierstau.${handler}`,
  config: { auth: false as const },
});

export default {
  routes: [
    route('POST', '/papierstau/sync', 'sync'),
    route('GET', '/papierstau/runs', 'runs'),
    route('GET', '/papierstau/runs/:id', 'run'),
    route('GET', '/papierstau/state', 'state'),
  ],
};
