import crypto from "node:crypto";
import { neon } from "@neondatabase/serverless";
import type { SqlClient } from "@/lib/profileVotes";

const GUARD_CONFIG = {
  minuteWindowMs: Number(process.env.VOTE_GUARD_MINUTE_WINDOW_MS ?? 60_000),
  minuteLimit: Number(process.env.VOTE_GUARD_MINUTE_LIMIT ?? 15),
  hourWindowMs: Number(process.env.VOTE_GUARD_HOURLY_WINDOW_MS ?? 60 * 60 * 1000),
  hourLimit: Number(process.env.VOTE_GUARD_HOURLY_LIMIT ?? 120),
  profileWindowMs: Number(process.env.VOTE_GUARD_PROFILE_WINDOW_MS ?? 24 * 60 * 60 * 1000),
  profileLimit: Number(process.env.VOTE_GUARD_PROFILE_LIMIT ?? 6),
};

const HASH_SALT = process.env.VOTE_GUARD_SALT ?? "tfh-guard-v1";

function coerceNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function getSqlClient(sql: SqlClient | undefined, databaseUrl?: string): SqlClient {
  if (sql) return sql;
  const url = databaseUrl ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not configured for vote guard checks");
  }
  return neon(url) as unknown as SqlClient;
}

export type VoteGuardDecision =
  | { status: "allow" }
  | { status: "throttle"; reason: string; retryAfterMs: number }
  | { status: "block"; reason: string; retryAfterMs?: number };

export function hashClientIdentifier(identifier: string | null | undefined): string | null {
  if (!identifier) return null;
  return crypto.createHash("sha256").update(`${HASH_SALT}:${identifier}`).digest("hex");
}

type EvaluateVoteGuardParams = {
  clientHash: string | null;
  profileKey: string;
  sql?: SqlClient;
  databaseUrl?: string;
  now?: Date;
};

async function countWithinWindow(
  client: SqlClient,
  clientHash: string,
  windowMs: number,
  now: Date
): Promise<number> {
  const thresholdIso = new Date(now.getTime() - windowMs).toISOString();
  const rows = await client<{ window_count: number | string }>`
    SELECT COUNT(*) AS window_count
    FROM profile_votes
    WHERE client_hash = ${clientHash}
      AND created_at >= ${thresholdIso};
  `;
  return coerceNumber(rows[0]?.window_count ?? 0);
}

export async function evaluateVoteGuard({
  clientHash,
  profileKey,
  sql,
  databaseUrl,
  now,
}: EvaluateVoteGuardParams): Promise<VoteGuardDecision> {
  if (!clientHash) {
    return { status: "allow" };
  }
  if (GUARD_CONFIG.minuteLimit <= 0 && GUARD_CONFIG.hourLimit <= 0 && GUARD_CONFIG.profileLimit <= 0) {
    return { status: "allow" };
  }

  const referenceNow = now ?? new Date();
  const client = getSqlClient(sql, databaseUrl);

  if (GUARD_CONFIG.minuteLimit > 0) {
    const minuteCount = await countWithinWindow(
      client,
      clientHash,
      GUARD_CONFIG.minuteWindowMs,
      referenceNow
    );
    if (minuteCount >= GUARD_CONFIG.minuteLimit) {
      return {
        status: "throttle",
        reason: "Too many votes from this connection in a short window.",
        retryAfterMs: GUARD_CONFIG.minuteWindowMs,
      };
    }
  }

  if (GUARD_CONFIG.hourLimit > 0) {
    const hourCount = await countWithinWindow(
      client,
      clientHash,
      GUARD_CONFIG.hourWindowMs,
      referenceNow
    );
    if (hourCount >= GUARD_CONFIG.hourLimit) {
      return {
        status: "block",
        reason: "Too many votes from this connection recently.",
        retryAfterMs: GUARD_CONFIG.hourWindowMs,
      };
    }
  }

  if (GUARD_CONFIG.profileLimit > 0) {
    const windowIso = new Date(referenceNow.getTime() - GUARD_CONFIG.profileWindowMs).toISOString();
    const rows = await client<{ profile_count: number | string }>`
      SELECT COUNT(*) AS profile_count
      FROM profile_votes
      WHERE client_hash = ${clientHash}
        AND profile_key = ${profileKey}
        AND created_at >= ${windowIso};
    `;
    const profileCount = coerceNumber(rows[0]?.profile_count ?? 0);
    if (profileCount >= GUARD_CONFIG.profileLimit) {
      return {
        status: "block",
        reason: "Too many repeated votes for this profile from your connection.",
        retryAfterMs: GUARD_CONFIG.profileWindowMs,
      };
    }
  }

  return { status: "allow" };
}

export const voteGuardConfig = GUARD_CONFIG;
