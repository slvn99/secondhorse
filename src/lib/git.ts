import { execSync } from "child_process";
import path from "path";

export function getFileCreationDate(filePath: string): string | null {
  try {
    let rel = filePath.replace(/^\\+|^\/+/, "");
    if (rel.startsWith("v2/")) rel = rel.slice(3);
    const abs = path.join(process.cwd(), rel);
    const cmd = `git log --diff-filter=A --follow --format=%cs -1 -- "${abs.replace(/"/g, '\\"')}"`;
    const out = execSync(cmd, { encoding: "utf8" }).trim();
    return out || null;
  } catch {
    return null;
  }
}

export function getShortCommit(): string | null {
  try {
    const out = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
    return out || null;
  } catch {
    return null;
  }
}

/**
 * Returns the short hash of the latest commit that touched any of the given paths.
 * Paths can be absolute or relative to repo root. Directories are allowed.
 */
export function getLastChangeShortCommit(paths: string[]): string | null {
  try {
    const quote = (p: string) => `"${path.join(process.cwd(), p.replace(/^\\+|^\/+/, "")).replace(/"/g, '\\"')}"`;
    const args = paths.map(quote).join(" ");
    const cmd = `git log -1 --format=%h -- ${args}`;
    const out = execSync(cmd, { encoding: "utf8" }).trim();
    return out || null;
  } catch {
    return null;
  }
}

/**
 * Returns the commit date (YYYY-MM-DD) of the latest change across the given paths.
 */
export function getLastChangeDate(paths: string[]): string | null {
  try {
    const quote = (p: string) => `"${path.join(process.cwd(), p.replace(/^\\+|^\/+/, "")).replace(/"/g, '\\"')}"`;
    const args = paths.map(quote).join(" ");
    const cmd = `git log -1 --format=%cs -- ${args}`;
    const out = execSync(cmd, { encoding: "utf8" }).trim();
    return out || null;
  } catch {
    return null;
  }
}
