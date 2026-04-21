#!/usr/bin/env node
// Builds a distributable zip for non-technical clients.
import { readFileSync, existsSync, rmSync, mkdirSync, cpSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
process.chdir(ROOT);

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const version = pkg.version;
const folderName = `crm-local-v${version}`;
const outDir = path.join(ROOT, "dist");
const stageDir = path.join(outDir, folderName);
const zipPath = path.join(outDir, `${folderName}.zip`);

console.log(`\n  Construyendo paquete v${version}…\n`);

if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
mkdirSync(stageDir, { recursive: true });

// Files / dirs to include in the shipped zip. We intentionally exclude:
//  - node_modules (platform-specific native binaries; reinstalled on first run)
//  - .next        (client builds on first run)
//  - data         (the client starts with empty DB; our dev DB stays private)
//  - public/uploads (may contain dev logos)
//  - .git
//  - dist         (this output folder)
const include = [
  "src",
  "public",
  "scripts",
  "package.json",
  "package-lock.json",
  "next.config.ts",
  "postcss.config.mjs",
  "tsconfig.json",
  "next-env.d.ts",
  "eslint.config.mjs",
  "Iniciar CRM.command",
  "Iniciar CRM.bat",
  "LEEME.txt",
  "README.md",
  ".env.example",
];

for (const entry of include) {
  const from = path.join(ROOT, entry);
  if (!existsSync(from)) {
    console.warn(`  (!) Falta ${entry}, se omite`);
    continue;
  }
  const to = path.join(stageDir, entry);
  cpSync(from, to, {
    recursive: true,
    dereference: false,
    filter: (src) => {
      const base = path.basename(src);
      if (base === ".DS_Store") return false;
      if (base === "node_modules") return false;
      if (base === ".next") return false;
      if (base === "uploads" && src.endsWith(path.join("public", "uploads")))
        return false;
      return true;
    },
  });
}

// Create an empty public/uploads so logo upload works on first run
mkdirSync(path.join(stageDir, "public", "uploads"), { recursive: true });

// Zip it. Use the `zip` cli (macOS/Linux) or PowerShell (Windows).
const isWin = process.platform === "win32";
const cmd = isWin ? "powershell" : "zip";
const args = isWin
  ? [
      "-NoProfile",
      "-Command",
      `Compress-Archive -Path '${stageDir}' -DestinationPath '${zipPath}' -Force`,
    ]
  : ["-r", "-q", zipPath, folderName];
const res = spawnSync(cmd, args, {
  cwd: isWin ? ROOT : outDir,
  stdio: "inherit",
});
if (res.status !== 0) {
  console.error(`\n  ✖ Error al comprimir`);
  process.exit(1);
}

const sizeMb = (
  (await import("node:fs/promises")).then ? 0 : 0 // dummy
);
const { statSync } = await import("node:fs");
const size = statSync(zipPath).size;
const mb = (size / 1024 / 1024).toFixed(2);

console.log(`\n  ✔ Paquete listo:`);
console.log(`     ${zipPath}`);
console.log(`     (${mb} MB)\n`);
console.log(`  Cómo entregarlo a tu cliente:`);
console.log(`     1. Envíale el archivo ${folderName}.zip`);
console.log(`     2. Que lo descomprima donde quiera (Escritorio, Documentos…)`);
console.log(`     3. Que haga doble click en "Iniciar CRM.command" (Mac) o "Iniciar CRM.bat" (Windows)`);
console.log();
