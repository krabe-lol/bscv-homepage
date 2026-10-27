// Lädt den Build aus output/ per SFTP zu Hetzner Webhosting hoch (nichts wird auf dem Server gebaut oder installiert).
//   node scripts/deploy.mjs web [--dry-run]  → output/web → public_html/bscv_frontend
//   node scripts/deploy.mjs cms [--dry-run]  → output/cms → bscv_backend (dist, node_modules, Wurzeldateien)
//   --ohne-node-modules                      → beim cms-Deploy node_modules auslassen (z. B. für schnelle Tests)
//   --dry-run                                → lftp zeigt nur die Unterschiede, Einzeldateien werden nicht hochgeladen
// Windows: lftp läuft in Docker (alpine), Schlüssel aus ~/.ssh/bscv_deploy (oder DEPLOY_SSH_KEY_FILE).
// Linux (CI): lftp direkt, Schlüssel aus DEPLOY_SSH_KEY (Inhalt) oder DEPLOY_SSH_KEY_FILE (Pfad).
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HOST = process.env.DEPLOY_HOST ?? "REDACTED-HOST";
const PORT = process.env.DEPLOY_PORT ?? "22";
const USER = process.env.DEPLOY_USER ?? "REDACTED-USER";
const WEB_DIR = process.env.DEPLOY_WEB_DIR ?? "public_html/bscv_frontend";
const CMS_DIR = process.env.DEPLOY_CMS_DIR ?? "bscv_backend";
const DEFAULT_KEY_FILE = path.join(homedir(), ".ssh", "bscv_deploy");
const DOCKER_IMAGE = "alpine:3.20";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "output");
const isLinux = process.platform === "linux";

const args = process.argv.slice(2);
const target = args.find((arg) => !arg.startsWith("--"));
const dryRun = args.includes("--dry-run");
const skipModules = args.includes("--ohne-node-modules");
if (!["web", "cms"].includes(target)) {
  console.error("Aufruf: node scripts/deploy.mjs web|cms [--dry-run] [--ohne-node-modules]");
  process.exit(1);
}

const localDir = path.join(output, target);
const required = target === "web" ? ["index.html", ".htaccess"] : ["dist", "node_modules", "package.json", "package-lock.json", "server.js"];
const absent = required.filter((name) => !existsSync(path.join(localDir, name)));
if (absent.length) {
  console.error(`output/${target} ist unvollständig (fehlt: ${absent.join(", ")}). Zuerst bauen: node scripts/output.mjs --nur-${target}`);
  process.exit(1);
}

// Nur dist, node_modules und das Frontend-Verzeichnis werden mit --delete gespiegelt. Alles andere im Backend-Ordner
// (.env, public/uploads, .strapi-updater.json, ~/logs) kommt hier nie vor und bleibt unberührt.
// Mirror-Optionen: dist ohne --ignore-time (gleich große Dateien mit anderem Inhalt kommen vor), node_modules mit
// (wird bei jedem Build frisch installiert, die Zeiten unterscheiden sich immer, die Größe reicht).
const flag = dryRun ? " --dry-run" : "";
const commands = [];
if (target === "web") {
  commands.push(`mirror -R --delete --parallel=4${flag} /out/web ${WEB_DIR}`);
} else {
  commands.push(`mirror -R --delete --parallel=8${flag} /out/cms/dist ${CMS_DIR}/dist`);
  if (!skipModules) commands.push(`mirror -R --delete --ignore-time --parallel=8${flag} /out/cms/node_modules ${CMS_DIR}/node_modules`);
  if (!dryRun) {
    for (const file of ["package.json", "package-lock.json", "server.js", "favicon.png"]) {
      commands.push(`put -O ${CMS_DIR} /out/cms/${file}`);
    }
  }
}

let tempDir = null;
try {
  // Schlüsselquelle bestimmen
  let keyFile = process.env.DEPLOY_SSH_KEY_FILE ?? (isLinux ? null : DEFAULT_KEY_FILE);
  if (!keyFile && process.env.DEPLOY_SSH_KEY) {
    // OpenSSH verlangt Modus 600 und einen abschließenden Zeilenumbruch
    tempDir = mkdtempSync(path.join(tmpdir(), "deploy-"));
    keyFile = path.join(tempDir, "id");
    writeFileSync(keyFile, process.env.DEPLOY_SSH_KEY.replace(/\r\n/g, "\n").trimEnd() + "\n", { mode: 0o600 });
  }
  if (!keyFile || !existsSync(keyFile)) {
    throw new Error("Kein SSH-Schlüssel gefunden. DEPLOY_SSH_KEY (Inhalt) oder DEPLOY_SSH_KEY_FILE (Pfad) setzen.");
  }

  const lftpScript = (identity) =>
    [
      "set cmd:fail-exit yes",
      "set sftp:auto-confirm yes",
      "set net:max-retries 5",
      "set net:timeout 30",
      `set sftp:connect-program "ssh -a -x -i ${identity} -o BatchMode=yes -o StrictHostKeyChecking=accept-new"`,
      ...commands,
      "bye",
    ].join("; ");
  const login = ["-u", `${USER},`, `sftp://${HOST}:${PORT}`];

  console.log(`Deploy ${target} → ${HOST}${dryRun ? " (Trockenlauf, es wird nichts geschrieben)" : ""}`);
  let result;
  if (isLinux) {
    // Lokale Pfade /out/... gibt es in der CI nicht, daher auf output/ umbiegen
    const script = lftpScript(keyFile).replaceAll("/out/", `${output}/`);
    result = spawnSync("lftp", ["-e", script, ...login], { stdio: "inherit" });
  } else {
    // Nur die Schlüsseldatei einbinden, nicht den ganzen .ssh-Ordner; im Container kopieren, weil chmod 600 auf
    // dem gemounteten Windows-Pfad nicht wirkt
    const shell = 'cp /keys/id /tmp/id && chmod 600 /tmp/id && apk add --no-cache -q lftp openssh-client >/dev/null && exec lftp -e "$LFTP_SCRIPT" -u "$LOGIN" "$URL"';
    result = spawnSync(
      "docker",
      [
        "run", "--rm",
        "--mount", `type=bind,source=${path.resolve(keyFile)},target=/keys/id,readonly`,
        "--mount", `type=bind,source=${localDir},target=/out/${target},readonly`,
        "-e", `LFTP_SCRIPT=${lftpScript("/tmp/id")}`,
        "-e", `LOGIN=${USER},`,
        "-e", `URL=sftp://${HOST}:${PORT}`,
        DOCKER_IMAGE, "sh", "-c", shell,
      ],
      { stdio: "inherit" },
    );
  }
  if (result.error || result.status !== 0) {
    throw new Error(`Deploy fehlgeschlagen${result.error ? `: ${result.error.message}` : ` (Exit-Code ${result.status})`}.`);
  }
  console.log(dryRun ? "\nTrockenlauf beendet." : "\nDeploy beendet.");
  if (target === "cms" && !dryRun) console.log("Nächster Schritt: Node.js-App in konsoleH neu starten (cms.bscv.de).");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (tempDir) rmSync(tempDir, { recursive: true, force: true });
}
