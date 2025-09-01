import { execSync } from "child_process";

export function getLastCommitDate(): string | null {
  try {
    const out = execSync("git log -1 --format=%cs", { encoding: "utf8" }).trim();
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

