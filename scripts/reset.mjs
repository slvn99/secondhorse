#!/usr/bin/env node
/**
 * Resets the local workspace by clearing caches, removing node_modules/lockfile, and reinstalling deps.
 */

import { rm } from "fs/promises";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { clean } from "./clean.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function runCommand(command, args, options = {}) {
  const defaultShell = process.platform === "win32";
  const { shell: shellOverride, ...rest } = options;
  const spawnOptions = {
    stdio: "inherit",
    shell: shellOverride ?? defaultShell,
    ...rest,
  };
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, spawnOptions);
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

async function reinstallDependencies() {
  await runCommand("npm", ["install"], { cwd: repoRoot });
}

async function removeWithRetry(target, label, attempts = 3) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await rm(target, { recursive: true, force: true });
      return;
    } catch (error) {
      const code =
        typeof error === "object" && error && "code" in error ? error.code : undefined;
      if (
        attempt === attempts ||
        !["EBUSY", "EPERM", "ENOTEMPTY"].includes(code)
      ) {
        throw error;
      }
      const waitMs = attempt * 200;
      console.warn(`[reset] ${label} busy, retrying in ${waitMs}ms…`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
}

async function main() {
  console.log("[reset] Cleaning caches…");
  await clean({ silent: true });

  const nodeModules = path.join(repoRoot, "node_modules");
  const lockFile = path.join(repoRoot, "package-lock.json");

  console.log("[reset] Removing node_modules…");
  await removeWithRetry(nodeModules, "node_modules");

  console.log("[reset] Removing package-lock.json…");
  await removeWithRetry(lockFile, "package-lock.json");

  console.log("[reset] Reinstalling dependencies…");
  await reinstallDependencies();

  console.log("[reset] Done.");
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error("[reset] Failed:", error);
    process.exitCode = 1;
  });
}

export { main as reset };
