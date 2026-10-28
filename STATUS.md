# Status

## Aktueller Stand
- Live seit 27.10.2026: bscv.de (Frontend, statisch) und cms.bscv.de (Strapi)
  bei Hetzner Webhosting L.
- Seit 28.10.2026 automatischer Deploy: Push auf `main` → GitHub →
  Gitea-Mirror (git.krabe.lol) → Workflows bauen und laden per SFTP hoch.
  Der erste echte Deploy war erfolgreich, `.env` und Uploads blieben unberührt.

## Offene Aufgaben
- Config Sync und schnellerer Backend-Deploy sind fertig, aber noch nicht
  committet. Vor dem ersten Deploy auf `main` `npm run backup`: Beim ersten
  Start überschreibt Strapi live alle Ansichten und die Rechte von Public und
  Authenticated mit dem Stand aus `backend/config/sync`. Danach prüfen, ob
  bscv.de alles anzeigt.
- Seitentexte und Seiteneinstellung aufteilen, Schritt 1 fertig (nicht
  committet): neue Einzel-Einträge pro Seite bzw. Bereich (`*-page`,
  `section-documents`, `footer`), dazu `founded`/`classCount` in Der
  BSCV, `mylapsUrl` in Punktewertung, `officeEmail` in Kontakt und `email` in
  Seiteneinstellung (Wartungsseite). Rechte für Public kommen mit Config Sync.
  Die Website liest noch aus „Seitentexte“ und den alten Feldern der
  Seiteneinstellung (`founded`, `classCount`, `mylapsUrl`, `officeEmail`). Nach
  dem Deploy live (lokal teils schon erledigt) Texte und Werte von Hand
  übertragen und veröffentlichen. Schritt 2: Frontend umstellen (Lizenz-Kachel
  verlinkt dann auf `licenseTileLinkUrl`, leer = /kontakt, statt per Mail;
  interne Ziele mit `/` als Router-Link, Wartungsseite nimmt `email` statt
  `officeEmail`), „Seitentexte“ und in der Seiteneinstellung alles außer der
  Wartung entfernen, samt Sync-Datei und Public-Recht.
- Felder und technische Typ-Namen auf Englisch umgestellt, im Frontend auch
  Typen, Dateien und Komponenten (Seiten heißen `*Page`) (nicht committet).
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

## Bekannte Probleme
- Scheitert der Import von Config Sync beim Start, startet Strapi nicht.
  Notlösung: `bscv_backend/config/sync` auf dem Server umbenennen, Node.js neu
  starten, Fehler im Log suchen.
- Startseite: Bei ab 1024 px breiten, aber sehr hohen Fenstern (z. B. iPad Pro
  hochkant, 1024×1366) rutscht die rechte Kachelspalte im Hero unter das Bild
  und wird zu einer riesigen roten Kachel (Breite hängt an `100svh`).
- konsoleH hat Node.js einmal für bscv.de statt für cms.bscv.de aktiviert.
  Nach Änderungen an der Node.js-Konfiguration prüfen, welche Domain betroffen
  ist.
