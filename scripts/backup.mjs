// Lokales Backup der Produktionsdaten (Datenbank + Uploads), nur lesend gegen den Server.
//   npm run backup                       → Ziel: <Repo>/backups (oder BACKUP_DIR)
//   BACKUP_DIR=D:\Sicherung npm run backup
// Was passiert:
//   1. pg_dump (Custom-Format) der PostgreSQL-Datenbank bei Hetzner nach <BACKUP_DIR>/db/bscv-JJJJ-MM-TT_HHMM.dump,
//      die neuesten 30 Dumps bleiben erhalten.
//   2. Spiegelt bscv_backend/public/uploads per lftp/SFTP nach <BACKUP_DIR>/uploads. Ohne --delete: auf dem Server
//      gelöschte Dateien bleiben im Backup erhalten, übertragen wird nur Neues/Geändertes.
// Voraussetzung: Docker Desktop läuft (pg_dump und lftp gibt es unter Windows nicht), Zugangsdaten in backend/.env.server,
// SSH-Schlüssel C:\Users\<Name>\.ssh\bscv_deploy (überschreibbar mit DEPLOY_SSH_KEY_FILE).
//
// Wiederherstellen (Datenbank), <Dump> = Dateiname in <BACKUP_DIR>/db; Zugangsdaten wie in backend/.env.server:
//   docker run --rm -e PGSSLMODE=require -e PGPASSWORD=<Passwort> --mount type=bind,source=<BACKUP_DIR>\db,target=/in,readonly \
//     postgres:17-alpine pg_restore -h <DATABASE_HOST> -p 5432 -U <DATABASE_USERNAME> -d <DATABASE_NAME> --clean --if-exists --no-owner /in/<Dump>
//   (Für eine lokale Test-Datenbank statt -h/-U die lokalen Werte nehmen. Vorher Strapi stoppen.)
// Wiederherstellen (Uploads): Inhalt von <BACKUP_DIR>\uploads per SFTP/FTP nach bscv_backend/public/uploads hochladen,
//   z. B. mit lftp: mirror -R /out bscv_backend/public/uploads (ohne --delete).
//
// Täglich automatisch (Windows-Aufgabenplanung, 03:00 Uhr; Pfad anpassen):
//   schtasks /create /tn "BSCV Backup" /sc daily /st 03:00 /tr "cmd /c cd /d C:\git\bscv-homepage && npm run backup"
// Entfernen: schtasks /delete /tn "BSCV Backup" /f
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

const PG_IMAGE = "postgres:17-alpine"; // Client muss mindestens die Server-Version (17) haben
const LFTP_IMAGE = "alpine:3.20";
const REMOTE_UPLOADS = "bscv_backend/public/uploads";
const KEEP_DUMPS = 30;
const MIN_DUMP_BYTES = 10 * 1024; // kleiner ist kein brauchbarer Dump (leere Datenbank hat schon einige KB)

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const backupDir = path.resolve(process.env.BACKUP_DIR || path.join(root, "backups"));
const dbDir = path.join(backupDir, "db");
const uploadsDir = path.join(backupDir, "uploads");
const keyFile = process.env.DEPLOY_SSH_KEY_FILE || path.join(os.homedir(), ".ssh", "bscv_deploy");

const fail = (msg) => {
  console.error(msg);
  process.exit(1);
};

const formatSize = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`);

const pad = (n) => String(n).padStart(2, "0");
const now = new Date();
const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;

const countFiles = (dir) => {
  let count = 0;
  let size = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = countFiles(full);
      count += sub.count;
      size += sub.size;
    } else if (entry.isFile()) {
      count++;
      size += statSync(full).size;
    }
  }
  return { count, size };
};

// Zugangsdaten prüfen
const secretsFile = path.join(root, "backend", ".env.server");
if (!existsSync(secretsFile)) fail(`${secretsFile} fehlt (Datenbank-Zugangsdaten).`);
const env = parseEnv(readFileSync(secretsFile, "utf8"));
const missing = ["DATABASE_HOST", "DATABASE_NAME", "DATABASE_USERNAME", "DATABASE_PASSWORD"].filter((key) => !env[key]);
if (missing.length) fail(`In ${secretsFile} fehlen: ${missing.join(", ")}`);
// SFTP-Zugang: Umgebungsvariable oder (lokal, nicht im Git) backend/.env.server
const SFTP_HOST = process.env.DEPLOY_HOST || env.DEPLOY_HOST;
const SFTP_USER = process.env.DEPLOY_USER || env.DEPLOY_USER;
const SFTP_PORT = process.env.DEPLOY_PORT || env.DEPLOY_PORT || "22";
if (!SFTP_HOST || !SFTP_USER) fail(`DEPLOY_HOST und DEPLOY_USER fehlen (Umgebungsvariable oder in ${secretsFile}).`);
if (!existsSync(keyFile)) fail(`SSH-Schlüssel ${keyFile} nicht gefunden (Pfad per DEPLOY_SSH_KEY_FILE änderbar).`);

try {
  execFileSync("docker", ["info"], { stdio: "ignore" });
} catch {
  fail("Docker läuft nicht. Bitte Docker Desktop starten (wird für pg_dump und lftp gebraucht).");
}

const start = Date.now();
mkdirSync(dbDir, { recursive: true });
mkdirSync(uploadsDir, { recursive: true });

// --- 1. Datenbank ---
console.log("=== Datenbank ===");
const dumpName = `bscv-${stamp}.dump`;
const dumpPath = path.join(dbDir, dumpName);
// Passwort nur über eine temporäre env-Datei, nie als Argument (sichtbar in der Prozessliste)
const envFile = path.join(os.tmpdir(), `bscv-backup-${process.pid}.env`);
try {
  writeFileSync(
    envFile,
    [
      `PGHOST=${env.DATABASE_HOST}`,
      `PGPORT=${env.DATABASE_PORT || "5432"}`,
      `PGDATABASE=${env.DATABASE_NAME}`,
      `PGUSER=${env.DATABASE_USERNAME}`,
      `PGPASSWORD=${env.DATABASE_PASSWORD}`,
      // Hetzner verlangt TLS, die Zertifikatskette ist aber unvollständig: verschlüsselt, ohne Prüfung
      "PGSSLMODE=require",
      "",
    ].join("\n"),
    { mode: 0o600 },
  );
  const res = spawnSync(
    "docker",
    ["run", "--rm", "--env-file", envFile, "--mount", `type=bind,source=${dbDir},target=/out`, PG_IMAGE, "pg_dump", "-Fc", "--no-owner", "--no-acl", "-f", `/out/${dumpName}`],
    { stdio: "inherit" },
  );
  if (res.status !== 0) {
    rmSync(dumpPath, { force: true });
    fail("pg_dump ist fehlgeschlagen (siehe Meldung oben).");
  }
} finally {
  rmSync(envFile, { force: true });
}
const dumpSize = existsSync(dumpPath) ? statSync(dumpPath).size : 0;
if (dumpSize < MIN_DUMP_BYTES) {
  rmSync(dumpPath, { force: true });
  fail(`Dump ist leer oder zu klein (${dumpSize} Bytes), wurde verworfen.`);
}
console.log(`Dump: ${dumpPath} (${formatSize(dumpSize)})`);

// Alte Dumps aufräumen: der Dateiname enthält das Datum, alphabetisch = zeitlich
const dumps = readdirSync(dbDir).filter((f) => /^bscv-.*\.dump$/.test(f)).sort();
for (const old of dumps.slice(0, Math.max(0, dumps.length - KEEP_DUMPS))) {
  rmSync(path.join(dbDir, old), { force: true });
  console.log(`Alten Dump gelöscht: ${old}`);
}

// --- 2. Uploads ---
console.log("\n=== Uploads ===");
// Nur die Schlüsseldatei einbinden, nicht den ganzen .ssh-Ordner. Windows-Bind-Mounts haben falsche Rechte für ssh:
// Schlüssel im Container kopieren und chmod 600. Kein --delete und kein put: der Server wird nur gelesen.
const lftpScript = [
  "set sftp:auto-confirm yes",
  "set net:max-retries 5",
  "set net:timeout 30",
  'set sftp:connect-program "ssh -a -x -i /tmp/id -o BatchMode=yes -o StrictHostKeyChecking=accept-new"',
  `mirror --parallel=8 ${REMOTE_UPLOADS} /out`,
  "bye",
].join("; ");
const shell = `apk add -q lftp openssh-client && cp /key/id /tmp/id && chmod 600 /tmp/id && lftp -e "$LFTP_SCRIPT" -u ${SFTP_USER}, sftp://${SFTP_HOST}:${SFTP_PORT}`;
const mirror = spawnSync(
  "docker",
  [
    "run", "--rm",
    "-e", `LFTP_SCRIPT=${lftpScript}`,
    "--mount", `type=bind,source=${path.resolve(keyFile)},target=/key/id,readonly`,
    "--mount", `type=bind,source=${uploadsDir},target=/out`,
    LFTP_IMAGE, "sh", "-c", shell,
  ],
  { stdio: "inherit" },
);
if (mirror.status !== 0) fail("Spiegeln der Uploads ist fehlgeschlagen (siehe Meldung oben).");
const uploads = countFiles(uploadsDir);

const seconds = ((Date.now() - start) / 1000).toFixed(1);
console.log(`
Fertig in ${seconds} s.
  Datenbank: ${dumpName} (${formatSize(dumpSize)}), ${Math.min(dumps.length, KEEP_DUMPS)} Dump(s) im Archiv
  Uploads:   ${uploads.count} Dateien (${formatSize(uploads.size)}) in ${uploadsDir}
`);
