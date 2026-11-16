# Schnittstelle für Papierstau

Stand: 16.11.2026 · Version 1 · Branch `tortoc-work`, noch nicht live

Dieses Dokument beschreibt die Schnittstelle, über die Papierstau den Abgleich auf bscv.de anstößt und prüft, ob
seine Daten angekommen sind. Es richtet sich an die Entwickler von Papierstau. Die Gegenrichtung (bscv.de liest aus
Papierstau) beschreibt Papierstau selbst in `docs/betrieb/externe-api.md`, die Anforderungen von bscv.de an
Papierstau stehen dort in `docs/betrieb/anforderungen-bscv-de.md`.

**Pflege:** Wird ein Endpunkt, ein Feld, ein Statuscode oder das Verhalten des Abgleichs geändert, wird dieses
Dokument im selben Commit angepasst und die Änderung unten unter „Änderungen“ eingetragen.

Code: `backend/src/api/papierstau/` (Routen, Controller), `backend/src/papierstau/` (Abgleich `sync.ts`, Läufe
`runs.ts`, Stand `state.ts`, Fingerabdruck `map.ts`, Zugriff auf Papierstau `client.ts`).

## Inhalt

- [Überblick](#überblick)
- [Grundregeln](#grundregeln)
- [Fehler](#fehler)
- [POST /sync – Abgleich anstoßen](#post-sync--abgleich-anstoßen)
- [GET /runs – letzte Läufe](#get-runs--letzte-läufe)
- [GET /runs/:id – ein Lauf](#get-runsid--ein-lauf)
- [GET /state – Stand je Eintrag](#get-state--stand-je-eintrag)
- [Fingerabdruck sourceHash](#fingerabdruck-sourcehash)
- [Was bscv.de beim Abgleich macht](#was-bscvde-beim-abgleich-macht)
- [Beispiel: Veröffentlichen aus Papierstau](#beispiel-veröffentlichen-aus-papierstau)
- [Einrichtung](#einrichtung)
- [Änderungen](#änderungen)

## Überblick

```
Papierstau                                          bscv.de (cms.bscv.de)
──────────                                          ─────────────────────
POST /api/papierstau/sync            ───────────▶   202 { runId }
                                                    Abgleich im Hintergrund:
                                     ◀───────────   GET /api/external/v1/...  (Papierstau-API)
GET  /api/papierstau/runs/:runId     ───────────▶   status: running → succeeded | partial | failed
GET  /api/papierstau/state           ───────────▶   je Eintrag: published, sourceHash, syncedAt
```

1. Papierstau stößt den Abgleich an. Der Aufruf enthält keine Daten, nur den Token und optional die Bereiche.
2. bscv.de holt die Daten selbst über die externe API von Papierstau, übernimmt sie und veröffentlicht sie sofort.
3. Über `runs/:id` erfährt Papierstau, ob der Abgleich geklappt hat, und welche Einträge fehlgeschlagen sind.
4. Über `state` erkennt Papierstau jederzeit, welche Einträge auf bscv.de veraltet sind oder fehlen: Es vergleicht
   den `sourceHash` mit dem Fingerabdruck seiner eigenen API-Antwort.

Zusätzlich gleicht bscv.de jede Nacht um 3:00 Uhr (Europe/Berlin) alle Bereiche ab, falls ein Anstoß verloren
gegangen ist.

**Bereiche (`scopes`):**

| Bereich | Inhalt | Quelle in Papierstau |
|---|---|---|
| `clubs` | Vereine mit Logo und Kontakten | `GET /clubs`, `GET /clubs/:id/logo` |
| `events` | Renntermine mit Dokumenten | `GET /seasons`, `GET /events?seasonId=`, Dokumente nach BSCV-21 |
| `standings` | Punktewertung je Saison und Klasse mit PDF | `GET /seasons`, `GET /classes?seasonId=`, `GET /standings?…`, PDF nach BSCV-28 |

Ein Lauf arbeitet die Bereiche immer in dieser Reihenfolge ab, weil Renntermine auf Vereine verweisen.

## Grundregeln

- **Basisadresse:** `https://cms.bscv.de/api/papierstau` (lokal `http://localhost:4081/api/papierstau`).
- **Authentifizierung:** jeder Aufruf mit `Authorization: Bearer <Token>`. Der Token ist `PAPIERSTAU_SYNC_TOKEN`
  aus der Serverkonfiguration von bscv.de, mindestens 32 Zeichen. In Papierstau steht er als `BSCV_SYNC_TOKEN`.
  Er wird in konstanter Zeit verglichen. Eine Anmeldung bei Strapi (Admin oder API-Token von Strapi) gilt hier nicht.
- **Nur serverseitig:** Papierstau ruft die Schnittstelle von seinem Server auf. Der Token gehört nie in einen Browser.
- **Format:** JSON (UTF-8). Zeitpunkte sind ISO 8601 in UTC (`2026-11-16T11:40:59.818Z`).
- **Keine Ratenbegrenzung** auf bscv.de. Bitte trotzdem sparsam abfragen: den Status eines Laufs höchstens alle
  2 Sekunden.
- **Kein Personenbezug:** Die Antworten enthalten nur Kennungen aus Papierstau, Zähler, Fingerabdrücke und
  Fehlermeldungen. Fehlermeldungen können Namen von Vereinen oder Pfade der Papierstau-API enthalten.

## Fehler

Fehler haben immer dasselbe Format:

```json
{ "error": { "code": "unauthenticated", "message": "Der Token fehlt oder ist ungültig." } }
```

| Status | `code` | Bedeutung |
|---|---|---|
| 401 | `unauthenticated` | Header fehlt, ist kein `Bearer`, oder der Token stimmt nicht. |
| 404 | `not_found` | Lauf unbekannt (nie angelegt, älter als die letzten 20, oder bei einem Neustart verloren). |
| 422 | `invalid_input` | Unbekannter Bereich, ungültiges `limit`. |
| 503 | `not_configured` | Auf bscv.de fehlt der Token (oder ist kürzer als 32 Zeichen), `PAPIERSTAU_URL` oder `PAPIERSTAU_API_KEY`. Wird **vor** dem Token geprüft. |
| 500 | – | Unerwarteter Fehler in Strapi (Format von Strapi). |

## POST /sync – Abgleich anstoßen

Startet einen Abgleich. Die Antwort kommt sofort, der Abgleich läuft danach im Hintergrund.

**Body** (optional, `Content-Type: application/json`):

```json
{ "scopes": ["clubs", "events", "standings"] }
```

| Feld | Pflicht | Bedeutung |
|---|---|---|
| `scopes` | nein | Bereiche, die abgeglichen werden sollen. Fehlt das Feld oder ist die Liste leer, sind es alle drei. Unbekannte Werte: `422`. Doppelte Werte zählen einmal. |

**Antwort `202`:**

```json
{
  "accepted": true,
  "runId": "a635a5f3-5fb3-4a10-9b47-589b953b31c4",
  "status": "running",
  "scopes": ["clubs", "events", "standings"]
}
```

| Feld | Bedeutung |
|---|---|
| `runId` | Kennung des Laufs, der diesen Anstoß ausführt (UUID). Damit fragt Papierstau den Status ab. |
| `status` | `running`, wenn der Lauf sofort startet; `queued`, wenn gerade ein anderer läuft. |
| `scopes` | Bereiche dieses Laufs, in fester Reihenfolge. Bei einem zusammengefassten Lauf alle bisher angeforderten. |

**Warteschlange:** Es läuft nie mehr als ein Abgleich gleichzeitig.

- Läuft keiner, startet der neue sofort.
- Läuft einer, wird ein wartender Lauf angelegt (`queued`).
- Gibt es schon einen wartenden, wird der Anstoß **in ihn zusammengefasst**: Die Bereiche werden vereinigt, und die
  Antwort nennt dieselbe `runId` wie beim vorigen Anstoß. Mehrere Anstöße kurz hintereinander führen so zu höchstens
  einem zusätzlichen Lauf.

Der Grund des Laufs (`reason`) ist bei Anstößen über diesen Endpunkt `Anstoß aus Papierstau`.

## GET /runs – letzte Läufe

```
GET /api/papierstau/runs?limit=5
```

| Parameter | Bedeutung |
|---|---|
| `limit` | 1 bis 20, Standard 20. Sonst `422`. |

**Antwort `200`:** ein Array von [Lauf-Objekten](#lauf-objekt). Zuerst der wartende, dann der laufende, danach die
abgeschlossenen, neueste zuerst. Gespeichert werden die letzten 20 abgeschlossenen Läufe. Sie überstehen einen
Neustart von Strapi.

Damit kann Papierstau z. B. „zuletzt erfolgreich veröffentlicht am …“ anzeigen: der erste Lauf mit
`status: "succeeded"` und dessen `finishedAt`.

## GET /runs/:id – ein Lauf

```
GET /api/papierstau/runs/a635a5f3-5fb3-4a10-9b47-589b953b31c4
```

**Antwort `200`:** ein [Lauf-Objekt](#lauf-objekt). Unbekannter Lauf: `404`.

**Neustart:** Wartende und laufende Läufe stehen nur im Speicher. Startet Strapi während eines Laufs neu (z. B. nach
einem Deploy), ist der Lauf verloren und `runs/:id` antwortet `404`. Papierstau behandelt einen `404` für einen
eben angestoßenen Lauf deshalb als „verloren“ und stößt erneut an. Die Daten bleiben dabei konsistent: Jeder
Eintrag wird für sich geschrieben, und der nächste Lauf holt den Rest nach.

### Lauf-Objekt

```json
{
  "id": "c1bee4c4-c597-417d-85ab-986bd57f1060",
  "status": "partial",
  "reason": "Anstoß aus Papierstau",
  "scopes": ["clubs", "events", "standings"],
  "requestedAt": "2026-11-16T11:41:07.480Z",
  "startedAt": "2026-11-16T11:41:07.481Z",
  "finishedAt": "2026-11-16T11:41:07.730Z",
  "results": {
    "clubs": {
      "created": 0, "updated": 1, "unchanged": 0, "unpublished": 1, "failed": 1,
      "failures": [
        { "papierstauId": "k3x9…", "message": "Inhalt (application/pdf) passt nicht zum Dateityp image/png bei /api/external/v1/clubs/k3x9…/logo" }
      ]
    },
    "events": { "created": 0, "updated": 1, "unchanged": 1, "unpublished": 1, "failed": 0, "failures": [] },
    "standings": { "created": 0, "updated": 1, "unchanged": 1, "unpublished": 0, "failed": 0, "failures": [] }
  }
}
```

| Feld | Bedeutung |
|---|---|
| `id` | Kennung (UUID) |
| `status` | siehe unten |
| `reason` | Grund: `Anstoß aus Papierstau`, `nächtlicher Abgleich`; bei zusammengefassten Läufen mit Komma verbunden |
| `scopes` | Bereiche des Laufs |
| `requestedAt` | Zeitpunkt des (ersten) Anstoßes |
| `startedAt`, `finishedAt` | Beginn und Ende; `null`, solange noch nicht erreicht |
| `results` | Ergebnis je Bereich; leer (`{}`), bis der ganze Lauf fertig ist. |

**Status:**

| `status` | Bedeutung |
|---|---|
| `queued` | wartet auf einen laufenden Abgleich |
| `running` | läuft |
| `succeeded` | alle Bereiche vollständig übernommen |
| `partial` | alle Bereiche durchgelaufen, aber einzelne Einträge fehlgeschlagen (`failed > 0`); die übrigen sind übernommen |
| `failed` | mindestens ein Bereich abgebrochen (`error` gesetzt), z. B. weil Papierstau nicht erreichbar war |

**Ergebnis je Bereich:**

| Feld | Bedeutung |
|---|---|
| `created` | neu angelegt und veröffentlicht |
| `updated` | geändert (oder wieder veröffentlicht) |
| `unchanged` | unverändert, nicht geschrieben |
| `unpublished` | zurückgezogen, weil Papierstau den Eintrag nicht mehr liefert |
| `failed` | Einträge, die nicht übernommen werden konnten |
| `failures` | die ersten 100 davon mit `papierstauId` und Grund |
| `error` | nur bei Abbruch des Bereichs: Grund. Dann wurde in diesem Bereich **nichts zurückgezogen**, und alle Zähler stehen auf 0, auch wenn vor dem Abbruch schon Einträge geschrieben wurden (z. B. Wertungen einer früheren Saison). `GET /state` zeigt den tatsächlichen Stand. |

## GET /state – Stand je Eintrag

```
GET /api/papierstau/state
GET /api/papierstau/state?scope=clubs,events
```

| Parameter | Bedeutung |
|---|---|
| `scope` | Bereiche, mit Komma getrennt. Standard: alle. Unbekannte Werte: `422`. |

**Antwort `200`:**

```json
{
  "generatedAt": "2026-11-16T11:42:00.000Z",
  "clubs": [
    { "papierstauId": "k3x9…", "published": true, "sourceHash": "9c1e…", "syncedAt": "2026-11-16T11:41:07.560Z" }
  ],
  "events": [],
  "standings": [
    { "papierstauId": "s2026…:c02…", "published": true, "sourceHash": "4be0…", "syncedAt": "2026-11-16T11:41:07.700Z" }
  ]
}
```

Je Bereich ein Array, nach `papierstauId` sortiert. Enthalten sind alle Einträge auf bscv.de, die aus Papierstau
stammen. Von Hand angelegte Einträge ohne Papierstau-Kennung fehlen.

| Feld | Bedeutung |
|---|---|
| `papierstauId` | Kennung in Papierstau: `id` des Vereins bzw. der Veranstaltung; bei Wertungen `<seasonId>:<classId>` |
| `published` | `true`: auf bscv.de sichtbar. `false`: zurückgezogen (Papierstau hat den Eintrag zuletzt nicht mehr geliefert) |
| `sourceHash` | [Fingerabdruck](#fingerabdruck-sourcehash) der Daten, die bscv.de zuletzt übernommen hat; `null`, wenn unbekannt |
| `syncedAt` | wann bscv.de den Eintrag zuletzt geschrieben hat |

**Auswerten in Papierstau:** Für jeden Eintrag, den Papierstau über seine externe API ausliefert:

| Vergleich | Ergebnis |
|---|---|
| Eintrag fehlt in `state` | noch nicht auf bscv.de |
| `published: false` | auf bscv.de zurückgezogen, obwohl Papierstau ihn liefert → veraltet |
| `sourceHash` ≠ eigener Fingerabdruck | veraltet |
| `sourceHash` = eigener Fingerabdruck und `published: true` | aktuell |

Einträge in `state`, die Papierstau nicht mehr liefert, sollten `published: false` haben. Steht dort `true`, wurde
der Rückzug noch nicht abgeglichen.

Wertungen ohne Zeilen und ohne PDF übernimmt bscv.de nicht. Papierstau lässt sie beim Vergleich ebenfalls aus.

## Fingerabdruck sourceHash

`sourceHash` ist SHA-256 (hexadezimal, Kleinbuchstaben) über das **kanonische JSON** des Eintrags, und zwar so, wie
Papierstau ihn über seine externe API ausgeliefert hat:

| Bereich | Eintrag |
|---|---|
| `clubs` | ein Element der Antwort von `GET /clubs`, unverändert (inkl. `logoUrl`, `driverCount`, `updatedAt`) |
| `events` | ein Element der Antwort von `GET /events?seasonId=`, unverändert (inkl. `documents`, sobald es sie gibt) |
| `standings` | die vollständige Antwort von `GET /standings?seasonId=&classId=` (inkl. `pdf`, sobald es das gibt) |

**Kanonisches JSON:**

1. Objekte: Schlüssel sortiert nach der Standardsortierung von JavaScript (`Array.prototype.sort()` auf den
   Schlüsseln, also nach UTF-16-Codeeinheiten), rekursiv in allen Ebenen.
2. Arrays: Reihenfolge bleibt.
3. Werte wie `JSON.stringify` (Zeichenketten, Zahlen, `true`, `false`, `null`). `null` bleibt erhalten.
4. Keine Leerzeichen oder Zeilenumbrüche zwischen den Elementen.
5. Der Text wird als UTF-8 gehasht.

Referenz (TypeScript, genau so in `backend/src/papierstau/map.ts`):

```ts
import { createHash } from 'node:crypto';

export const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map((v) => (v === undefined ? 'null' : canonicalJson(v))).join(',')}]`;
  const record = value as Record<string, unknown>;
  const entries = Object.keys(record)
    .filter((k) => record[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonicalJson(record[k])}`);
  return `{${entries.join(',')}}`;
};

export const sourceHash = (value: unknown) => createHash('sha256').update(canonicalJson(value)).digest('hex');
```

Papierstau bildet den Wert am einfachsten über das Objekt, das seine externe API ohnehin zurückgibt, also **nach** der
Ausgabeprüfung (`response(...)`), damit dieselben Felder drin sind. In Python ergibt
`json.dumps(obj, sort_keys=True, separators=(',', ':'), ensure_ascii=False)` denselben Text (für Schlüssel ohne
Zeichen außerhalb der BMP).

**Was den Fingerabdruck ändert:** jede Änderung an den gelieferten Daten, auch `updatedAt` oder `driverCount`.
**Was ihn nicht ändert:** Änderungen nur auf bscv.de, etwa ein Verein, der zurückgezogen wird und deshalb bei einem
Rennen nicht mehr verlinkt ist. Der Eintrag ist dann trotzdem „aktuell“.

## Was bscv.de beim Abgleich macht

Zum Verständnis von Fehlern und Zählern. Maßgeblich ist der Code in `backend/src/papierstau/sync.ts`.

**Allgemein**

- Zugeordnet wird über `papierstauId`. Beim **ersten** Abgleich werden vorhandene Einträge ohne Kennung so
  zugeordnet: Vereine über den Namen (Groß/Klein, Leer- und Satzzeichen egal), Rennen über das Datum. Beides nur, wenn
  es eindeutig ist, sonst wird neu angelegt.
- Übernommenes wird **sofort veröffentlicht**. Unveränderte Einträge werden nicht geschrieben (`unchanged`).
- Was Papierstau nicht mehr liefert, wird **zurückgezogen, nicht gelöscht**. Fotos und Texte der Redaktion bleiben
  dabei erhalten. Taucht der Eintrag wieder auf, wird er wieder veröffentlicht.
- **Schutz:** Liefert Papierstau für einen Bereich eine leere Liste, wird nichts zurückgezogen (Warnung im Log). Ist
  eine Liste nicht ladbar, bricht der Bereich ab (`error`), ebenfalls ohne Rückzug.
- Einzelne Einträge, die scheitern, landen in `failures`. Die übrigen werden trotzdem übernommen.

**Zugriff auf Papierstau**

- Nur an die Adresse aus `PAPIERSTAU_URL` (https, `http` nur für localhost). Pfade aus Papierstau (`logoUrl`, `url`)
  müssen auf denselben Rechner zeigen, Weiterleitungen werden nicht verfolgt.
- Zeitlimit 20 Sekunden je Anfrage, Dateien höchstens 15 MB.
- Dateien: Der `Content-Type` muss erlaubt sein (Logos: PNG, JPEG, GIF, WebP; Dokumente zusätzlich PDF; Wertung: nur
  PDF), und der Inhalt muss an seiner Signatur als genau dieser Typ erkennbar sein. Sonst scheitert der Eintrag.
- Dateien werden nur neu geladen, wenn sich ihr `sha256` bzw. Inhalt geändert hat. Ersetzte Dateien, die der Abgleich
  angelegt hat, werden aus der Medienbibliothek gelöscht.

**Vereine (`clubs`)**

| Papierstau | bscv.de |
|---|---|
| `name`, `website` | Vereinsname, Website. Eine Website, die nicht wie eine Webadresse aussieht (z. B. `javascript:`), wird verworfen. |
| `logoUrl` | Logo. Ohne Logo in Papierstau bleibt ein von Hand gepflegtes stehen; ein früher übernommenes wird entfernt. |
| `president`, `mailingAddress` | Kontakte. `address` wird in Straße und Ort geteilt (`…, 12345 Ort`; sonst alles als Straße). Ungültige E-Mail wird verworfen. |
| `founded`, `driverCount` | Kennzahlen „Gründungsjahr“ und „Aktive Fahrer“. Weitere Kennzahlen pflegt die Redaktion. |

Texte, Farben, Sortiername, Fahrzeugfoto und -grafik pflegt die Redaktion. Der Abgleich ändert sie nicht.

**Renntermine (`events`)**

- Alle Saisons aus `GET /seasons`, je Saison `GET /events`.
- Übernommen: Datum, Nennschluss, Ort, Endlauf, Klassen, Dokumente (sobald es BSCV-21 gibt).
- Veranstalter: als Verknüpfung, wenn der Verein auf bscv.de veröffentlicht ist, sonst als Text.
- Titel und Rennstrecke pflegt die Redaktion. Neue Rennen bekommen als Titel den Ort, sonst den Veranstalter.

**Punktewertung (`standings`)**

- Je Saison alle Klassen aus `GET /classes?seasonId=`, je Klasse `GET /standings`. Klassen ohne Zeilen und ohne PDF
  werden übersprungen.
- Übernommen: Tabelle (Wertungsläufe und Zeilen), Saison, Klasse, Reihenfolge der Klassen, PDF (sobald es BSCV-28
  gibt).

## Beispiel: Veröffentlichen aus Papierstau

```ts
const BSCV = process.env.BSCV_SYNC_URL!.replace(/\/sync$/, ''); // https://cms.bscv.de/api/papierstau
const headers = { Authorization: `Bearer ${process.env.BSCV_SYNC_TOKEN}`, 'Content-Type': 'application/json' };

async function publish(scopes: string[]) {
  const res = await fetch(`${BSCV}/sync`, { method: 'POST', headers, body: JSON.stringify({ scopes }), redirect: 'error' });
  if (res.status !== 202) throw new Error(`bscv.de ${res.status}`);
  const { runId } = await res.json();

  // Status abfragen, bis der Lauf fertig ist (höchstens 5 Minuten)
  for (let i = 0; i < 150; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const r = await fetch(`${BSCV}/runs/${runId}`, { headers });
    if (r.status === 404) return { status: 'lost' as const }; // Neustart auf bscv.de: erneut anstoßen
    const run = await r.json();
    if (!['queued', 'running'].includes(run.status)) return run; // succeeded | partial | failed
  }
  return { status: 'timeout' as const };
}

// Veraltete Vereine ermitteln
async function staleClubs(ownClubs: unknown[] /* Antwort von GET /api/external/v1/clubs */) {
  const state = await (await fetch(`${BSCV}/state?scope=clubs`, { headers })).json();
  const byId = new Map(state.clubs.map((e: { papierstauId: string }) => [e.papierstauId, e]));
  return ownClubs.filter((club: any) => {
    const entry: any = byId.get(club.id);
    return !entry || !entry.published || entry.sourceHash !== sourceHash(club);
  });
}
```

`curl`:

```bash
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"scopes":["clubs"]}' https://cms.bscv.de/api/papierstau/sync
curl -s -H "Authorization: Bearer $TOKEN" https://cms.bscv.de/api/papierstau/runs/<runId>
curl -s -H "Authorization: Bearer $TOKEN" "https://cms.bscv.de/api/papierstau/state?scope=standings"
```

## Einrichtung

Auf bscv.de (in `backend/.env.server`, `scripts/output.mjs` schreibt sie in die `.env` des Servers):

| Variable | Bedeutung |
|---|---|
| `PAPIERSTAU_URL` | Basisadresse der externen API von Papierstau, z. B. `https://papierstau.example.org/api/external/v1` |
| `PAPIERSTAU_API_KEY` | API-Schlüssel aus Papierstau (`pak_…`, Rechte `clubs`, `events`, `standings`) |
| `PAPIERSTAU_SYNC_TOKEN` | Token für diese Schnittstelle, mindestens 32 Zeichen, z. B. `openssl rand -hex 32` |

Ohne URL und Schlüssel ist der Abgleich aus, die Schnittstelle antwortet dann `503`. Nach einer Änderung Node.js für
cms.bscv.de in konsoleH neu starten.

In Papierstau: `BSCV_SYNC_URL=https://cms.bscv.de/api/papierstau/sync` und `BSCV_SYNC_TOKEN` (derselbe Wert wie
`PAPIERSTAU_SYNC_TOKEN`). Pro Umgebung eigene Werte; die Testinstanz von Papierstau stößt nie das Live-bscv.de an.

**Token wechseln:** neuen Wert auf beiden Seiten eintragen, bscv.de neu starten. Bis Papierstau den neuen Wert hat,
schlagen Anstöße mit `401` fehl; der nächtliche Abgleich läuft unabhängig davon.

## Änderungen

| Datum | Version | Änderung |
|---|---|---|
| 16.11.2026 | 1 | Erste Fassung: `POST /sync` mit `runId`, `GET /runs`, `GET /runs/:id`, `GET /state` mit `sourceHash`. |
