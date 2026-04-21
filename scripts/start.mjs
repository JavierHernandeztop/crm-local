#!/usr/bin/env node
// Smart launcher: installs/builds on first run, then serves the CRM and opens the browser.
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import net from "node:net";
import { platform } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const IS_WIN = platform() === "win32";

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
};

const say = (m) => console.log(`${c.cyan}▶${c.reset}  ${m}`);
const ok = (m) => console.log(`${c.green}✔${c.reset}  ${m}`);
const warn = (m) => console.log(`${c.yellow}!${c.reset}  ${m}`);
const fail = (m) => console.error(`${c.red}✖${c.reset}  ${m}`);

function header() {
  const line = "─".repeat(44);
  console.log();
  console.log(`  ${c.bold}${c.magenta}CRM Local${c.reset}  ${c.dim}· tu negocio, en tu computadora${c.reset}`);
  console.log(`  ${c.dim}${line}${c.reset}`);
  console.log();
}

function run(cmd, args) {
  const res = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: IS_WIN,
    env: process.env,
  });
  return res.status === 0;
}

async function firstFreePort(start = 3000, end = 3050) {
  for (let p = start; p <= end; p++) {
    const free = await new Promise((resolve) => {
      const srv = net.createServer();
      srv.once("error", () => resolve(false));
      srv.once("listening", () => srv.close(() => resolve(true)));
      srv.listen(p, "127.0.0.1");
    });
    if (free) return p;
  }
  return start;
}

function openBrowser(url) {
  setTimeout(() => {
    const cmd = platform() === "darwin" ? "open" : IS_WIN ? "cmd" : "xdg-open";
    const args = IS_WIN ? ["/c", "start", "", url] : [url];
    try {
      spawn(cmd, args, { stdio: "ignore", detached: true }).unref();
    } catch {
      // no-op
    }
  }, 1800);
}

function checkNode() {
  const [majStr] = process.versions.node.split(".");
  const major = Number(majStr);
  if (major < 20) {
    fail(`Necesitas Node.js 20 o superior. Tienes ${process.versions.node}.`);
    console.log(
      `   ${c.dim}Descarga la última versión en ${c.reset}${c.cyan}https://nodejs.org/es${c.reset}`,
    );
    process.exit(1);
  }
}

async function main() {
  header();
  checkNode();

  const needInstall = !existsSync(path.join(ROOT, "node_modules"));
  const needBuild = !existsSync(path.join(ROOT, ".next"));

  if (needInstall) {
    say("Primera vez aquí — instalando dependencias (1–2 min)…");
    const ciOk = run("npm", ["ci", "--no-audit", "--no-fund"]);
    const installOk =
      ciOk ||
      (warn("npm ci falló, probando con npm install…"),
      run("npm", ["install", "--no-audit", "--no-fund"]));
    if (!installOk) {
      fail("No se pudieron instalar las dependencias.");
      console.log(`   ${c.dim}Revisa tu conexión a internet y vuelve a intentar.${c.reset}`);
      process.exit(1);
    }
    ok("Dependencias listas.");
  }

  if (needBuild) {
    say("Compilando la aplicación (solo la primera vez)…");
    if (!run("npx", ["--no-install", "next", "build"])) {
      fail("Error en la compilación.");
      process.exit(1);
    }
    ok("Compilación lista.");
  }

  const port = await firstFreePort(3000, 3050);
  const url = `http://localhost:${port}`;

  console.log();
  ok(`CRM corriendo en ${c.bold}${c.cyan}${url}${c.reset}`);
  console.log(
    `   ${c.dim}Deja esta ventana abierta mientras uses el CRM.${c.reset}`,
  );
  console.log(
    `   ${c.dim}Cierra la ventana o pulsa Ctrl+C para detenerlo.${c.reset}`,
  );
  console.log();

  openBrowser(url);

  const child = spawn(
    "npx",
    ["--no-install", "next", "start", "-H", "127.0.0.1", "-p", String(port)],
    {
      cwd: ROOT,
      stdio: "inherit",
      shell: IS_WIN,
      env: process.env,
    },
  );

  const shutdown = (signal) => () => child.kill(signal);
  process.on("SIGINT", shutdown("SIGINT"));
  process.on("SIGTERM", shutdown("SIGTERM"));
  child.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  fail(String(err?.message ?? err));
  process.exit(1);
});
