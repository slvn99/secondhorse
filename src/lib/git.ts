import { execSync as realExecSync } from "child_process";

// Indirection for testability: allow swapping execSync in tests
let _execSync: typeof realExecSync = realExecSync;
export function __setExecSyncForTests(fn: typeof realExecSync) {
  _execSync = fn;
}

export function getLastCommitDate(): string | null {
  try {
    const out = _execSync("git log -1 --format=%cs", { encoding: "utf8" } as any).trim();
    return out || null;
  } catch {
    return null;
  }
}

export function getShortCommit(): string | null {
  try {
    const out = _execSync("git rev-parse --short HEAD", { encoding: "utf8" } as any).trim();
    return out || null;
  } catch {
    return null;
  }
}
