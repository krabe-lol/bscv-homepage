# Status

## Aktueller Stand
- Live seit 27.10.2026: bscv.de (Frontend, statisch) und cms.bscv.de (Strapi)
  bei Hetzner Webhosting L.
- Seit 28.10.2026 automatischer Deploy: Push auf `main` → GitHub →
  Gitea-Mirror (git.krabe.lol) → Workflows bauen und laden per SFTP hoch.
  Der erste echte Deploy war erfolgreich, `.env` und Uploads blieben unberührt.

## Offene Aufgaben
- Branch `tortoc-work`: Anbindung an Papierstau (krabe-lol/papierstau).
  Papierstau ist die Quelle für Vereine, Renntermine und Punktewertung,
  Übernommenes erscheint sofort veröffentlicht. Papierstau ist noch nicht
  live, bscv.de bereitet nur vor. Anforderungen an Papierstau: dort
  `docs/betrieb/anforderungen-bscv-de.md` (Branch `tortoc-work`).
  **Umgesetzt, noch nicht committet:**
  - Backend: `src/papierstau/` (Client, Abbildung, Medien, Abgleich),
    `POST /api/papierstau/sync` (Token `PAPIERSTAU_SYNC_TOKEN`, ohne Daten,
    antwortet 202, Abgleich im Hintergrund, nie zwei gleichzeitig),
    nächtlicher Abgleich 3 Uhr (`config/cron-tasks.ts`). Einstellungen in
    `config/papierstau.ts`, Variablen in `backend/.env.example`. Neue Felder
    siehe `CMS.md` („PS“), Ansichten per Config Sync exportiert.
  - Schnittstelle für Papierstau ausführlich in `PAPIERSTAU-API.md`
    (bei jeder Änderung nachziehen, Regel in `CLAUDE.md`).
  - Rückmeldung an Papierstau (gleicher Token): `POST /sync` liefert eine
    `runId`; `GET /api/papierstau/runs[/:id]` zeigt den Lauf (queued,
    running, succeeded, partial, failed) mit Zählern und Fehlern je Eintrag,
    die letzten 20 Läufe überstehen einen Neustart (Core-Store).
    `GET /api/papierstau/state` liefert je `papierstauId` `published`,
    `sourceHash` und `syncedAt`. `sourceHash` ist SHA-256 über das kanonische
    JSON (Schlüssel sortiert, ohne Leerzeichen) des Eintrags, wie Papierstau
    ihn geliefert hat; Papierstau rechnet denselben Wert über seine
    API-Antwort und erkennt so veraltete oder fehlende Einträge.
  - Dateien aus Papierstau werden am Inhalt geprüft (Signatur muss zum
    gemeldeten Typ passen), weil Strapi das beim Ablegen aus dem Code nicht
    tut.
  - Zuordnung: `papierstauId`; beim ersten Abgleich Vereine über den Namen,
    Rennen über das Datum (nur wenn eindeutig). Was Papierstau nicht mehr
    liefert, wird zurückgezogen, nicht gelöscht; liefert Papierstau eine leere
    Liste oder ist es nicht erreichbar, wird nichts zurückgezogen. Unveränderte
    Einträge werden nicht geschrieben (Fingerabdruck in `papierstauSync`).
    Dateien (Logo, Ausschreibungen, PDF der Wertung) nur bei geändertem
    Inhalt neu, ersetzte Dateien des Abgleichs werden gelöscht.
  - Frontend: Punktewertung als Tabelle je Klasse (aktuelle Saison offen,
    Archiv darunter, PDF-Link), von Hand gepflegte PDF-Wertungen als „Weitere
    Wertungen“. Renntermine: Ort ohne Strecke, Veranstalter als Text,
    Endlauf, Nennschluss und Ausschreibungen bei kommenden Rennen. Fax bei
    den Kontakten der Vereine.
  - Getestet gegen einen Papierstau-Mock (Doku-Format inkl. BSCV-21 und
    BSCV-28) mit einer Kopie der lokalen Datenbank: Anlegen, Zuordnen über den
    Namen, unverändert, Ändern von Logo/Dokument/PDF, Zurückziehen, leere
    Liste, Papierstau nicht erreichbar, Token- und Eingabeprüfung,
    Warteschlange, Status `partial`, `sourceHash` unabhängig in Python
    nachgerechnet (stimmt überein). Frontend:
    Lint und Build ok, Sichtprüfung Desktop und Handy.
  **Offen:** Test gegen die echte Testinstanz (`papierstau.krabe.lol`, braucht
  Schlüssel und Erreichbarkeit); erst danach Felder im Admin sperren, die
  Papierstau gehören (jetzt noch nicht, weil die Redaktion live bis zum
  Go-live von Hand pflegt); `classes` anzeigen. Die lokale `.tmp/data.db` ist
  veraltet (deutsche Tabellennamen, Rechte fehlen), Strapi migriert sie beim
  nächsten Start.
  Entschieden: Strecken, Vereinstexte, Farben, Sortiername und Fotos bleiben
  in Strapi. Das PDF der Wertung erzeugt Papierstau (setzt tortoc dort
  selbst um), Strapi übernimmt es. Vorgemerkt für später: Rennergebnisse je
  Lauf, Live-Ergebnisse am Renntag, Gebühren, Fristen, Zahlen für „Der
  BSCV“. Clutch-Bestenliste entfällt.
- Config Sync und schnellerer Backend-Deploy sind auf `dev` committet, noch
  nicht deployt. Vor dem ersten Deploy auf `main` `npm run backup`: Beim ersten
  Start überschreibt Strapi live alle Ansichten und die Rechte von Public und
  Authenticated mit dem Stand aus `backend/config/sync`. Danach prüfen, ob
  bscv.de alles anzeigt.
- Schritt 2 auf `dev` committet, noch nicht live: Website liest die neuen
  Einzel-Einträge, „Seitentexte“, „Post“ und die alten Felder der
  Seiteneinstellung sind entfernt. „Der BSCV“ hat Titel, Kennzahlen und
  Freitext; Vereine haben Kennzahlen statt `foundedYear` (Komponente `stat`,
  Vorgaben für neue Vereine in `backend/src/index.ts`). Migrationen
  `merge-about-text` und `stats` übernehmen die Daten, getestet mit einer
  Kopie der Live-Datenbank (Backup 2026-10-28_2203). Deploy wie zuvor: Backup,
  Backend, Neustart, dann Frontend. Danach unter Rollen → Editor die neuen
  Einzel-Einträge, Funktion und Videograf freigeben (Admin-Rollen kommen
  nicht per Config Sync).
- Felder und technische Typ-Namen auf Englisch umgestellt, im Frontend auch
  Typen, Dateien und Komponenten (Seiten heißen `*Page`), auf `dev` committet.
  Zwei Migrationen in `backend/database/migrations` übernehmen die Daten
  (`rename-fields`, dann `rename-types`), getestet mit SQLite und mit
  PostgreSQL 16 in Docker ab dem Live-Stand, inkl. Rechten von Public und
  Admin-Rollen. Alte Frontend-Version und neues Backend passen nicht zusammen.
  Reihenfolge: `npm run backup`, Backend deployen, in konsoleH neu starten
  (Migrationen laufen), erst danach das Frontend. Alle Typen und Felder
  (deutsch/englisch) stehen in `CMS.md`. Lokal vor Tests mit
  `strapi console` den Ordner `backend/dist` löschen, sonst lädt Strapi alte
  Typen mit.
- Release vom 28.10.2026 (Videokanäle, Funktionsgruppen der Funktionäre,
  Hero-Fix) auf cms.bscv.de nachziehen: Die Freigaben für Public bei
  „Videograf“ und „Funktion“ kommen mit Config Sync (vorher von Hand unter
  Einstellungen → Rollen → Public, sonst fehlen die Videokanäle und die
  Funktionäre bleiben ungruppiert). Live Funktionen anlegen, jedem Funktionär
  seine Funktion zuordnen (eine pro Person) und neu veröffentlichen,
  Videografen anlegen.
- Neustart nach Backend-Deploys ist Handarbeit. Offen beim Hetzner-Support:
  Startet ein beendeter Node.js-Prozess automatisch neu?
- Altes Secret `DEPLOY_SSH_KEY` in Gitea löschen, falls noch vorhanden.
- Optional: Gitea-Mirror auf privat stellen (derzeit öffentlich, nur im
  Heimnetz erreichbar) und alte Actions-Läufe mit dem widerrufenen Schlüssel
  im Log löschen.

## Entscheidungen
- BSCV ist ein Vereinsprojekt, kein privates krabe.lol-Projekt: kein
  Design-System von ui.krabe.lol und keine Versionierung nach dem Regelwerk.
- Nichts auf dem Server bauen: Hetzner darf Prozesse bei Lastspitzen beenden.
  Die Linux-`node_modules` entstehen im Container `node:22-bullseye`.
- Produktionsdatenbank ist PostgreSQL bei Hetzner, lokal SQLite.
- Gitea holt den Code per Pull-Mirror von GitHub, wie bei den anderen
  krabe.lol-Projekten.
- Deploy-Schlüssel liegt als Base64-Secret `DEPLOY_SSH_KEY_B64` in Gitea, weil
  Gitea mehrzeilige Secrets im Log nicht maskiert. Der Schlüssel wurde am
  28.10.2026 deshalb ausgetauscht (Kommentar `bscv-deploy-2026-10`).
- Backend-Deploy lädt `node_modules` nur hoch, wenn sich `package-lock.json`
  geändert hat (spart rund 2 Minuten). Die `package-lock.json` auf dem Server
  zeigt an, welche `node_modules` dort liegen. Beim Start von Hand lässt sich
  das Hochladen mit „node_modules erzwingen“ trotzdem auslösen.
- Ansichten im Content-Manager und die Rechte von Public/Authenticated kommen
  per Plugin Config Sync aus `backend/config/sync`, weil sie sonst nur in der
  lokalen Datenbank liegen. Ablauf: lokal ändern, unter Einstellungen → Config
  Sync exportieren, committen, deployen; der Server spielt sie bei jedem Start
  ein. Live geänderte Ansichten oder Rechte gehen dabei verloren. Admin-Rollen,
  Sprachen und die übrigen Einstellungen (Upload, Mails, Login-Anbieter)
  bleiben außen vor. `npm audit` meldet adm-zip im Plugin; die Lücken betreffen
  das Entpacken, das Plugin packt nur (Download der Exporte).
- Texte und Angaben liegen in je einem Einzel-Eintrag pro Seite bzw. Bereich,
  damit man sie dort findet, wo sie erscheinen. Die Seiteneinstellung enthält
  nur noch die Wartung (mit eigener E-Mail für die Wartungsseite). Übertragen
  von Hand in zwei Schritten statt Migrationscode, der auf die
  Live-Datenbank schreibt.
- Namen: Felder sind Englisch und einheitlich (`name` für Personen, Orte und
  Organisationen, `title` für Inhalte und Dokumente, `position` zum Sortieren).
  Technische Typ-Namen sind ebenfalls Englisch (`club`, `track`, `download`, weil
  `document` in Strapi reserviert ist). Anzeigenamen und Beschriftungen im Admin
  bleiben Deutsch, weil die Redaktion kein Englisch kann. Spalten und Verknüpfungstabellen werden nie ohne Migration
  umbenannt, sonst legt Strapi leere neue an und löscht die alten.
- Uploads sind nicht im Git. Gesichert wird mit `npm run backup` nach
  `backups/` (Datenbank-Dump und Uploads).
- Desktop-Ansicht (Menü, Layouts) erst ab 1152 px: Breakpoint `lg` ist in
  `frontend/src/index.css` umgestellt. Seitenrand der Inhalte ab dort 120 px,
  240 px erst ab 1920 px. Unterseiten zeigen eine Breadcrumb
  (`components/ui/Breadcrumb.tsx`), Startseite und Wartungsseite nicht.

## Bekannte Probleme
- Scheitert der Import von Config Sync beim Start, startet Strapi nicht.
  Notlösung: `bscv_backend/config/sync` auf dem Server umbenennen, Node.js neu
  starten, Fehler im Log suchen.
- Startseite: Bei ab 1152 px breiten, aber sehr hohen Fenstern (iPad Pro
  hochkant mit 1024 px zeigt seit der Umstellung die Mobil-Ansicht) rutscht die rechte Kachelspalte im Hero unter das Bild
  und wird zu einer riesigen roten Kachel (Breite hängt an `100svh`).
- konsoleH hat Node.js einmal für bscv.de statt für cms.bscv.de aktiviert.
  Nach Änderungen an der Node.js-Konfiguration prüfen, welche Domain betroffen
  ist.
