// Baut Frontend und Backend für Hetzner Webhosting nach output/, zum Hochladen per FTP (ohne Build auf dem Server).
//   npm run output              → output/web (bscv.de) und output/cms (cms.bscv.de, inkl. node_modules für Linux)
//   npm run output -- --nur-env → nur output/cms/.env aus backend/.env.server neu schreiben
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

const run = (cmd, cwd, env = {}) => execSync(cmd, { cwd, stdio: "inherit", env: { ...process.env, ...env } });

const copy = (from, to) => {
  mkdirSync(path.dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
};

// Secrets einmalig erzeugen und danach wiederverwenden, sonst wären nach jedem Deploy alle Admins abgemeldet
const secretsFile = path.join(backend, ".env.server");
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
const secrets = readFileSync(secretsFile, "utf8");
const missing = ["DATABASE_HOST", "DATABASE_NAME", "DATABASE_USERNAME", "DATABASE_PASSWORD"].filter((key) => !parseEnv(secrets)[key]);
if (missing.length) {
  console.error(`In ${secretsFile} fehlen noch: ${missing.join(", ")}`);
  process.exit(1);
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
  writeServerEnv();
  console.log("output/cms/.env geschrieben. Hochladen nach bscv_backend/.env, danach Node.js neu starten.");
  process.exit(0);
}

try {
  execSync("docker info", { stdio: "ignore" });
} catch {
  console.error("Docker läuft nicht. Bitte Docker Desktop starten (wird für die Linux-node_modules gebraucht).");
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });

console.log("\n=== Frontend ===");
run("npm run build", frontend, { VITE_API_URL: PUBLIC_URL });
copy(path.join(frontend, "dist"), path.join(out, "web"));

console.log("\n=== Backend ===");
run("npm run build", backend, { NODE_ENV: "production" });
// Leere Ordner mit .gitkeep: Strapi bricht ohne public/uploads ab
for (const file of ["dist", "package.json", "package-lock.json", "server.js", "favicon.png", "public/robots.txt", "public/uploads/.gitkeep", "database/migrations/.gitkeep"]) {
  copy(path.join(backend, file), path.join(cms, file));
}
writeServerEnv();

console.log("\n=== node_modules für Linux (Docker) ===");
// Gleiche npm-Version wie lokal, sonst hält das npm im Image die package-lock.json für veraltet.
// --no-bin-links: keine Symlinks, die lassen sich per FTP nicht hochladen
const npmVersion = execSync("npm -v").toString().trim();
run(`docker run --rm --mount type=bind,source=${cms},target=/app -w /app ${NODE_IMAGE} npx --yes npm@${npmVersion} ci --omit=dev --no-bin-links --no-audit --no-fund`, root);

console.log(`
Fertig. Hochladen:
  output/web/*  → Ordner von bscv.de
  output/cms/*  → Ordner cms (Arbeitsverzeichnis der Node.js-App), danach Node.js neu starten
`);
