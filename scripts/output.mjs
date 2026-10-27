// Baut Frontend und Backend für Hetzner Webhosting nach output/, zum Hochladen per SFTP (ohne Build auf dem Server).
//   npm run output              → output/web (bscv.de) und output/cms (cms.bscv.de, inkl. node_modules für Linux)
//   npm run output -- --nur-env → nur output/cms/.env aus backend/.env.server neu schreiben
//   --nur-web / --nur-cms       → nur einen Teil bauen (und nur diesen Teil von output/ leeren), z. B. in der CI
// Unter Linux (CI) werden die node_modules direkt installiert, ohne Docker.
// Datenbank ist PostgreSQL bei Hetzner; Inhalte kommen per `strapi transfer`, nicht per FTP.
import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

const PUBLIC_URL = "https://cms.bscv.de";
// Nur diese Seiten dürfen die API aus dem Browser abfragen (CORS)
const FRONTEND_URLS = ["https://bscv.de", "https://www.bscv.de"];
// Linux-Build der nativen Module (sharp; better-sqlite3 nur für die lokale Entwicklung); Hauptversion muss zur
// Node.js-Version in konsoleH passen. Aus dem Quellcode Gebautes braucht mindestens die glibc des Images (bullseye: 2.31).
const NODE_IMAGE = "node:22-bullseye";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const backend = path.join(root, "backend");
const frontend = path.join(root, "frontend");
const out = path.join(root, "output");
const cms = path.join(out, "cms");

const onlyWeb = process.argv.includes("--nur-web");
const onlyCms = process.argv.includes("--nur-cms");
if (onlyWeb && onlyCms) {
  console.error("--nur-web und --nur-cms schließen sich aus.");
  process.exit(1);
}
const buildWeb = !onlyCms;
const buildCms = !onlyWeb;
const isLinux = process.platform === "linux";

const run = (cmd, cwd, env = {}) => execSync(cmd, { cwd, stdio: "inherit", env: { ...process.env, ...env } });

const copy = (from, to) => {
  mkdirSync(path.dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
};

// Secrets einmalig erzeugen und danach wiederverwenden, sonst wären nach jedem Deploy alle Admins abgemeldet.
// Nur fürs Backend nötig. In der CI (Linux) gibt es keine .env.server: Die .env des Servers wird getrennt
// gepflegt (lokal per --nur-env) und darf von der CI nie angefasst werden.
const secretsFile = path.join(backend, ".env.server");
const needSecrets = buildCms || process.argv.includes("--nur-env");
let secrets = null;
if (needSecrets && !existsSync(secretsFile) && isLinux) {
  console.log("backend/.env.server fehlt (CI): output/cms/.env wird nicht geschrieben, DATABASE-Prüfung entfällt.");
} else if (needSecrets) {
  if (!existsSync(secretsFile)) {
    const secret = () => randomBytes(16).toString("base64");
    const lines = [
      "# Secrets für cms.bscv.de, von scripts/output.mjs erzeugt. Nicht ins Git, nicht weitergeben.",
      `APP_KEYS=${[secret(), secret(), secret(), secret()].join(",")}`,
      `API_TOKEN_SALT=${secret()}`,
      `ADMIN_JWT_SECRET=${secret()}`,
      `TRANSFER_TOKEN_SALT=${secret()}`,
      `JWT_SECRET=${secret()}`,
      `ENCRYPTION_KEY=${secret()}`,
      "",
      "# PostgreSQL bei Hetzner (konsoleH → Datenbanken), von Hand eintragen",
      "DATABASE_HOST=",
      "DATABASE_PORT=5432",
      "DATABASE_NAME=",
      "DATABASE_USERNAME=",
      "DATABASE_PASSWORD=",
      "",
      "# SMTP für Mails aus Strapi (z. B. Postfach bei Hetzner: Host mail.your-server.de, Port 587), von Hand eintragen",
      "SMTP_HOST=",
      "SMTP_PORT=587",
      "SMTP_USERNAME=",
      "SMTP_PASSWORD=",
      "SMTP_FROM=",
    ];
    writeFileSync(secretsFile, lines.join("\n") + "\n");
    console.log(`Neue Produktions-Secrets in ${secretsFile} angelegt.`);
  }
  secrets = readFileSync(secretsFile, "utf8");
  const missing = ["DATABASE_HOST", "DATABASE_NAME", "DATABASE_USERNAME", "DATABASE_PASSWORD"].filter((key) => !parseEnv(secrets)[key]);
  if (missing.length) {
    console.error(`In ${secretsFile} fehlen noch: ${missing.join(", ")}`);
    process.exit(1);
  }
}

// Hetzner verlangt TLS, liefert aber keine vollständige Zertifikatskette: verschlüsselt, ohne Prüfung des Zertifikats
const writeServerEnv = () => {
  mkdirSync(cms, { recursive: true });
  writeFileSync(
    path.join(cms, ".env"),
    secrets +
      `\nPUBLIC_URL=${PUBLIC_URL}\nIS_PROXIED=true\nCORS_ORIGIN=${FRONTEND_URLS.join(",")}\n` +
      "DATABASE_CLIENT=postgres\nDATABASE_SSL=true\nDATABASE_SSL_REJECT_UNAUTHORIZED=false\n",
  );
};

// npm run output -- --nur-env: nur output/cms/.env neu schreiben, z. B. nach Änderungen an .env.server
if (process.argv.includes("--nur-env")) {
  if (!secrets) {
    console.error("backend/.env.server fehlt, .env kann nicht geschrieben werden.");
    process.exit(1);
  }
  writeServerEnv();
  console.log("output/cms/.env geschrieben. Hochladen nach bscv_backend/.env, danach Node.js neu starten.");
  process.exit(0);
}

// Docker nur auf Nicht-Linux-Systemen (Windows) nötig, dort für die Linux-node_modules
if (buildCms && !isLinux) {
  try {
    execSync("docker info", { stdio: "ignore" });
  } catch {
    console.error("Docker läuft nicht. Bitte Docker Desktop starten (wird für die Linux-node_modules gebraucht).");
    process.exit(1);
  }
}

// Ohne Flag alles leeren; mit Flag nur den eigenen Teil, damit der andere Teil von output/ erhalten bleibt
if (buildWeb && buildCms) rmSync(out, { recursive: true, force: true });
else rmSync(buildWeb ? path.join(out, "web") : cms, { recursive: true, force: true });

if (buildWeb) {
  console.log("\n=== Frontend ===");
  run("npm run build", frontend, { VITE_API_URL: PUBLIC_URL });
  copy(path.join(frontend, "dist"), path.join(out, "web"));
}

if (buildCms) {
  console.log("\n=== Backend ===");
  run("npm run build", backend, { NODE_ENV: "production" });
  // Leere Ordner mit .gitkeep: Strapi bricht ohne public/uploads ab
  for (const file of ["dist", "package.json", "package-lock.json", "server.js", "favicon.png", "public/robots.txt", "public/uploads/.gitkeep", "database/migrations/.gitkeep"]) {
    copy(path.join(backend, file), path.join(cms, file));
  }
  if (secrets) writeServerEnv();

  console.log(isLinux ? "\n=== node_modules (Linux) ===" : "\n=== node_modules für Linux (Docker) ===");
  // --no-bin-links: keine Symlinks, die lassen sich per FTP nicht hochladen
  if (isLinux) {
    run("npm ci --omit=dev --no-bin-links --no-audit --no-fund", cms);
  } else {
    // Gleiche npm-Version wie lokal, sonst hält das npm im Image die package-lock.json für veraltet.
    const npmVersion = execSync("npm -v").toString().trim();
    run(`docker run --rm --mount type=bind,source=${cms},target=/app -w /app ${NODE_IMAGE} npx --yes npm@${npmVersion} ci --omit=dev --no-bin-links --no-audit --no-fund`, root);
  }
}

console.log(`
Fertig. Hochladen:
${buildWeb ? "  output/web/*  → public_html/bscv_frontend (bscv.de), am einfachsten: npm run deploy:web\n" : ""}${buildCms ? "  output/cms/*  → bscv_backend (cms.bscv.de), am einfachsten: npm run deploy:cms; danach Node.js neu starten\n" : ""}`);
