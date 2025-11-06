#!/usr/bin/env node
/**
 * Cross-platform cleanup for build artefacts and caches.
 * Removes Next.js and Turbo caches plus any *.tsbuildinfo files near the repo root.
 */

import { rm, readdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const CACHE_DIRS = [".next", ".turbo", "coverage"];
const EXPLICIT_FILES = ["tsconfig.tsbuildinfo"];
const TSBUILDINFO_SUFFIX = ".tsbuildinfo";
const MAX_DEPTH = 2;

function log(step, target) {
  console.log(`[clean] ${step}: ${path.relative(repoRoot, target) || "."}`);
}

async function removePath(target) {
  await rm(target, { recursive: true, force: true });
}

async function collectTsBuildInfo(dir, depth = 0, acc = []) {
  if (depth > MAX_DEPTH) return acc;
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return acc;
  }

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectTsBuildInfo(fullPath, depth + 1, acc);
    } else if (entry.isFile() && entry.name.endsWith(TSBUILDINFO_SUFFIX)) {
      acc.push(fullPath);
    }
  }
  return acc;
}

export async function clean({ silent = false } = {}) {
  const targets = CACHE_DIRS.map((dir) => path.join(repoRoot, dir));
  const explicitFiles = EXPLICIT_FILES.map((file) => path.join(repoRoot, file));
  const tsbuildinfoFiles = await collectTsBuildInfo(repoRoot);
  const fileTargets = Array.from(new Set([...explicitFiles, ...tsbuildinfoFiles]));

  for (const target of targets) {
    if (!silent) log("removing directory", target);
    await removePath(target);
  }

  for (const file of fileTargets) {
    if (!silent) log("removing file", file);
    await removePath(file);
  }

  if (!silent) {
    console.log("[clean] Done.");
  }
}

if (process.argv[1] === __filename) {
  clean().catch((error) => {
    console.error("[clean] Failed:", error);
    process.exitCode = 1;
  });
}
