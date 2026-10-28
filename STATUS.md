# Status

## Aktueller Stand
- Live seit 27.10.2026: bscv.de (Frontend, statisch) und cms.bscv.de (Strapi)
  bei Hetzner Webhosting L.
- Seit 28.10.2026 automatischer Deploy: Push auf `main` → GitHub →
  Gitea-Mirror (git.krabe.lol) → Workflows bauen und laden per SFTP hoch.
  Der erste echte Deploy war erfolgreich, `.env` und Uploads blieben unberührt.

## Offene Aufgaben
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
- Uploads sind nicht im Git. Gesichert wird mit `npm run backup` nach
  `backups/` (Datenbank-Dump und Uploads).

## Bekannte Probleme
- konsoleH hat Node.js einmal für bscv.de statt für cms.bscv.de aktiviert.
  Nach Änderungen an der Node.js-Konfiguration prüfen, welche Domain betroffen
  ist.
