# Regeln für Claude

## Regelwerk übernehmen und aktuell halten
- Quelle der allgemeinen Regeln ist `CLAUDE.md` im Repo
  https://git.krabe.lol/krabe-lol/Claude-Ruleset (Branch `main`), lokal
  geklont unter `~/Claude-Ruleset`.
- Zu Beginn jeder Session im lokalen Klon `git pull` ausführen. Schlägt das
  fehl (z. B. fehlende Zugangsdaten), mit dem lokalen Stand weiterarbeiten und
  kurz Bescheid geben.
- Hat das aktuelle Projekt noch keine `CLAUDE.md` im Root, die Regeln dorthin
  übernehmen und als `CLAUDE.md` anlegen.
- Hat es bereits eine, prüfen, ob im Regelwerk Regeln hinzugekommen oder
  geändert worden sind, und die Änderungen übernehmen. Übernommene Änderungen
  kurz nennen.
- Projektspezifische Regeln stehen in der Projekt-`CLAUDE.md` in einem eigenen
  Abschnitt `## Projektspezifisch` und bleiben beim Abgleich unverändert.
- Im Repo `~/Claude-Ruleset` selbst ist nichts zu übernehmen – dort liegt die
  Quelle.

## Kommunikation
- Antworte auf Deutsch, außer ich schreibe auf Englisch.
- Fasse dich kurz: erst das Ergebnis, dann nur die nötigen Details.
- Wenn eine Anforderung unklar ist und die Entscheidung bei mir liegt, frag nach, statt zu raten.

## Arbeitsweise
- Lies vorhandenen Code, bevor du ihn änderst, und halte dich an den bestehenden Stil.
- Ändere nur, was für die Aufgabe nötig ist. Kein ungefragtes Refactoring.
- Führe nach Änderungen vorhandene Tests bzw. Linter aus und berichte ehrlich über das Ergebnis.
- Lege keine neuen Abhängigkeiten an, ohne es vorher zu erwähnen.

## Lokale Ports
- Lokale Dev-Server nie auf den Standard-Ports der Tools laufen lassen
  (z. B. Vite 5173, Strapi 1337, Storybook 6006, 3000), damit mehrere Projekte
  gleichzeitig laufen können.
- Die Belegung steht in `ports.md` im Ruleset-Repo (lokal
  `~/Claude-Ruleset/ports.md`): Jedes Projekt hat einen Zehnerblock ab 4040,
  Endziffer 0 = Frontend, 1 = Backend, ab 2 weitere Dienste (API, Storybook,
  Tests …).
- Nutzt ein Projekt noch Standard-Ports, auf seinen Block umstellen, die Ports
  fest in der Projekt-Config eintragen (bei Vite mit `strictPort: true`) und
  kurz Bescheid geben.
- Neues Projekt oder neuer Dienst: nächsten freien Block bzw. die nächste freie
  Endziffer nehmen und in `ports.md` eintragen.

## Projektstatus
- Jedes Projekt führt eine `STATUS.md` im Root mit: aktuellem Stand,
  offenen Aufgaben, getroffenen Entscheidungen (mit kurzer Begründung)
  und bekannten Problemen.
- Zu Beginn einer Session `STATUS.md` lesen, statt den bisherigen Chat
  nachzuvollziehen.
- Nach abgeschlossenen Arbeitsschritten bzw. vor Session-Ende aktualisieren.
  Knapp halten: Erledigtes, das keine Auswirkungen mehr hat, entfernen
  (die Historie steht in Git).
- Fehlt die Datei, anlegen.
- `STATUS.md` wird mit ins Repo eingecheckt (nicht in `.gitignore`).

## UI / Design-System
- Verbindliche Vorgabe für jede Oberfläche ist das Design-System unter
  https://ui.krabe.lol/ (Storybook, React + Vite, Komponenten im shadcn/ui-Stil
  unter `src/components/ui/`).
- Vor UI-Arbeit dort nachsehen, welche Komponente passt. Die Liste aller
  Komponenten liefert `https://ui.krabe.lol/index.json`, die Doku-Seite jeder
  Komponente zeigt Varianten und Props.
- Vorhandene Komponenten verwenden (Button, Card, Dialog, Field, Input, Select,
  Table, Tabs, Sonner, Typography …) und keine eigenen Varianten mit
  abweichendem Aussehen nachbauen.
- Farben, Abstände, Radien und Schrift kommen aus den Tokens und der
  Typography-Komponente des Design-Systems, nicht aus festen Werten im Code.
- Fehlt eine Komponente oder Variante, erst Bescheid geben, statt etwas
  Eigenes zu bauen. Neues gehört ins Design-System (mit Story), nicht nur ins
  einzelne Projekt.

## Git
- Standard-Branch ist `main`.
- Committe und pushe nur, wenn ich darum bitte. Ausnahme: der Versions-Bump
  (siehe Versionierung).
- Commit-Messages auf Englisch, im Imperativ, kurze erste Zeile (max. ~72 Zeichen).
- Claude taucht nie als Autor oder Contributor auf: kein `Co-Authored-By`-Trailer,
  keine „Generated with Claude Code“-Zeile o. Ä. in Commits, Tags oder PRs.
- Keine destruktiven Befehle (`push --force`, `reset --hard`, Branch löschen) ohne Rückfrage.

## Gitea-Actions (git.krabe.lol)
- Projekt-Repos liegen auf GitHub (Organisation `krabe-lol`), git.krabe.lol
  spiegelt sie als Pull-Mirror. Gepusht wird nach GitHub, der Mirror ist
  schreibgeschützt.
- Der Mirror-Sync löst `on: push`-Workflows aus. Das Intervall steht in den
  Mirror-Einstellungen (z. B. `10m`), sofort geht es per „Jetzt
  synchronisieren“.
- Mirror eines privaten GitHub-Repos: fine-grained Token mit Resource owner
  `krabe-lol`, nur dieses Repo, Contents read-only.
- Actions sind pro Repo einzuschalten: Einstellungen → Erweiterte
  Einstellungen → Actions.
- Runner haben das Label `ubuntu-latest` und führen Jobs in Docker aus; ein
  eigenes Image per `container:` im Job funktioniert.
- Gitea nennt den Jobs die Adresse `http://server:3000`, die Job-Container
  nicht auflösen können. `actions/checkout` daher immer mit
  `with: github-server-url: https://git.krabe.lol` verwenden. Es meldet sich
  mit dem Job-Token an und funktioniert so auch bei privaten Repos.
- Die Workflow-Liste und „Workflow ausführen“ (`workflow_dispatch`) zeigt
  Gitea nur für Workflows auf dem Default-Branch.
- Zugangsdaten als Secret unter Einstellungen → Actions → Secrets ablegen, nie
  im Workflow oder im Repo.
- Mehrzeilige Secrets (z. B. SSH-Schlüssel) Base64-kodiert in einer Zeile
  ablegen und im Job dekodieren. Gitea maskiert mehrzeilige Werte in der
  `env:`-Anzeige der Logs nicht, sie stehen dort sonst im Klartext.

## Versionierung
- Semver `MAJOR.MINOR.PATCH`. Solange ein Projekt noch nicht live ist (Beta),
  gilt striktes `0.MINOR.PATCH` – Major bleibt `0`.
- Steht die Version an mehreren Stellen (z. B. Backend- und Frontend-`package.json`),
  müssen alle Stellen immer denselben Wert haben.

### Wann welche Stelle erhöht wird
- **MINOR** (`0.X.0`, PATCH zurück auf `0`): eine neue, für Nutzer oder
  API-Konsumenten sichtbare Funktion bzw. ein neues Modul (z. B. neuer
  Content-Type, neue Seite, neuer Workflow).
- **PATCH** (`0.x.X`): Bugfixes, Security-Fixes, Refactorings, Chores,
  Config-Änderungen. Mehrere zusammengehörige Fix-Commits (z. B. alle Findings
  eines Code-Reviews) zählen als EIN Patch-Release, nicht ein Patch pro Commit.
- Reine Dokumentations-/Tooling-Commits ohne Verhaltensänderung: kein Bump nötig.
- Niemals auf `1.0.0` bumpen, ohne dass ich das ausdrücklich anfrage – der Sprung
  auf die erste stabile/Live-Version ist eine bewusste Entscheidung.

### Ablauf bei einem Versions-Bump
Der Bump läuft eigenständig, ohne Rückfrage: Sobald Änderungen einen Bump
erfordern, die folgenden Schritte selbst ausführen, inklusive Push. Ausnahme:
Die `CLAUDE.md` des jeweiligen Projekts legt etwas anderes fest. Dann gilt die
Projektregel.

1. Version an allen Stellen auf den neuen Wert setzen (identischer Wert).
2. Eigenen Commit dafür erstellen: `chore: bump version to X.Y.Z`
3. Annotierten Tag auf genau diesem Commit setzen:
   `git tag -a vX.Y.Z -m "<kurze Zusammenfassung der enthaltenen Änderungen>"`
4. Commit und Tag pushen: `git push && git push --tags`

Nicht jeden einzelnen Commit taggen – Tags markieren Feature-Meilensteine
(MINOR) oder gebündelte Fix-Releases (PATCH). Bisheriges Muster mit
`git tag -n99` prüfen und daran orientieren.

## Sicherheit
- Keine Secrets, Passwörter oder Tokens in Dateien oder Commits schreiben.
- `.env`-Dateien und Zugangsdaten gehören in `.gitignore`.

## Projektspezifisch
- Gearbeitet wird auf `dev`. `main` ist der Live-Stand: Ein Push auf `main`
  wird über den Gitea-Mirror automatisch nach Hetzner deployt. `dev` nur auf
  ausdrückliche Bitte in `main` übernehmen (`git fetch . dev:main`, dann
  `git push origin main`).
- Ein Push auf `dev` startet die Deploy-Workflows als Trockenlauf: bauen und
  anzeigen, was sich auf dem Server ändern würde, ohne hochzuladen.
- Hosting ist Hetzner Webhosting L. Auf dem Server wird nichts gebaut oder
  installiert. Gebaut wird mit `scripts/output.mjs` (lokal oder in der CI),
  hochgeladen mit `scripts/deploy.mjs`. `.env`, `public/uploads` und `logs`
  auf dem Server nie überschreiben.
- Nach einem Backend-Deploy die Node.js-App für cms.bscv.de in konsoleH von
  Hand neu starten (`tmp/restart.txt` wirkt dort nicht).
- Inhalte (PostgreSQL bei Hetzner, Uploads) entstehen auf dem Server, er ist
  dafür die Quelle. Lokal läuft Strapi mit SQLite.
- Vor riskanten Änderungen am Live-Stand `npm run backup` ausführen (braucht
  Docker Desktop).
- Commits vor dem 28.10.2026 sind auf Deutsch und mit `Co-Authored-By`. Ab
  dann gelten die Git-Regeln oben, nicht der alte Stil.
- BSCV ist kein privates krabe.lol-Projekt. Die Abschnitte „UI /
  Design-System“ und „Versionierung“ gelten hier nicht: eigenes Design und
  eigene Versionsstände sind gewollt, kein automatischer Versions-Bump.
