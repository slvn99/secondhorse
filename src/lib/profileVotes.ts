import { neon } from "@neondatabase/serverless";
import {
  normalizeProfileIdentifier,
  parseProfileKey,
  type NormalizedProfileIdentifier,
  type ProfileIdentifier,
} from "@/lib/profileIds";

export type VoteDirection = "like" | "dislike";

export interface SqlClient {
  <T = any>(strings: TemplateStringsArray, ...values: any[]): Promise<T[]>;
  begin?<T>(callback: (sql: SqlClient) => Promise<T>): Promise<T>;
  transaction?<T = unknown>(
    queriesOrFactory:
      | Array<Promise<unknown>>
      | ((sql: SqlClient) => Array<Promise<unknown>>),
    options?: unknown
  ): Promise<T>;
}

export type ProfileVoteTotals = {
  profileKey: string;
  source: "db" | "seed";
  id: string;
  likes: number;
  dislikes: number;
  firstVoteAt: Date | null;
  lastVoteAt: Date | null;
  updatedAt: Date | null;
  profileCreatedAt: Date | null;
  profileAgeDays: number;
};

type TotalsRow = {
  profile_key: string;
  likes: number | string | null;
  dislikes: number | string | null;
  first_vote_at: string | Date | null;
  last_vote_at: string | Date | null;
  updated_at: string | Date | null;
};

type RecordVoteParams = {
  profile: ProfileIdentifier;
  direction: VoteDirection;
  sql?: SqlClient;
  databaseUrl?: string;
  timestamp?: Date;
};

type FetchTotalsParams = {
  profile: ProfileIdentifier | string;
  sql?: SqlClient;
  databaseUrl?: string;
};

const VALID_DIRECTIONS: VoteDirection[] = ["like", "dislike"];

function coerceDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function coerceNumber(value: number | string | null | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function getSqlClient(sql: SqlClient | undefined, databaseUrl?: string): SqlClient {
  if (sql) return sql;
  const url = databaseUrl ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not configured for vote persistence");
  }
  return neon(url) as unknown as SqlClient;
}

function mapTotalsRow(row: TotalsRow): {
  profileKey: string;
  likes: number;
  dislikes: number;
  firstVoteAt: Date | null;
  lastVoteAt: Date | null;
  updatedAt: Date | null;
} {
  return {
    profileKey: row.profile_key,
    likes: coerceNumber(row.likes),
    dislikes: coerceNumber(row.dislikes),
    firstVoteAt: coerceDate(row.first_vote_at),
    lastVoteAt: coerceDate(row.last_vote_at),
    updatedAt: coerceDate(row.updated_at),
  };
}

async function lookupProfileCreatedAt(
  sql: SqlClient,
  normalized: NormalizedProfileIdentifier
): Promise<Date | null> {
  if (normalized.source !== "db") return null;
  const rows = await sql<{ created_at?: string | Date | null }>`
    SELECT created_at
    FROM profiles
    WHERE id = ${normalized.id}
    LIMIT 1;
  `;
  const record = rows[0];
  if (!record) return null;
  return coerceDate(record.created_at ?? null);
}

async function buildProfileVoteTotals(
  client: SqlClient,
  normalized: NormalizedProfileIdentifier,
  base: ReturnType<typeof mapTotalsRow>,
  referenceNow: Date
): Promise<ProfileVoteTotals> {
  const profileCreatedAt = await lookupProfileCreatedAt(client, normalized);
  const now = base.updatedAt ?? referenceNow;
  return {
    profileKey: normalized.key,
    source: normalized.source,
    id: normalized.id,
    likes: base.likes,
    dislikes: base.dislikes,
    firstVoteAt: base.firstVoteAt,
    lastVoteAt: base.lastVoteAt,
    updatedAt: base.updatedAt,
    profileCreatedAt,
    profileAgeDays: profileAgeInDays({
      profileCreatedAt,
      firstVoteAt: base.firstVoteAt,
      now,
    }),
  };
}

export function profileAgeInDays(params: {
  profileCreatedAt?: Date | string | null;
  firstVoteAt?: Date | string | null;
  now?: Date;
}): number {
  const now = params.now ?? new Date();
  const createdAt = coerceDate(params.profileCreatedAt ?? null);
  const fallback = coerceDate(params.firstVoteAt ?? null);
  const anchor = createdAt ?? fallback;
  if (!anchor) return 0;
  const diffMs = now.getTime() - anchor.getTime();
  if (!Number.isFinite(diffMs) || diffMs <= 0) return 0;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return days >= 0 ? days : 0;
}

export async function recordProfileVote({
  profile,
  direction,
  sql,
  databaseUrl,
  timestamp,
}: RecordVoteParams): Promise<ProfileVoteTotals> {
  if (!VALID_DIRECTIONS.includes(direction)) {
    throw new Error(`Unsupported vote direction: ${direction}`);
  }
  const normalized = normalizeProfileIdentifier(profile);
  const createdAt = timestamp ? new Date(timestamp) : new Date();
  if (Number.isNaN(createdAt.getTime())) {
    throw new Error("Provided timestamp is invalid");
  }

  const client = getSqlClient(sql, databaseUrl);

  const runInsertVote = (tx: SqlClient) =>
    tx`
      INSERT INTO profile_votes (profile_key, direction, created_at)
      VALUES (${normalized.key}, ${direction}, ${createdAt.toISOString()});
    `;

  const runUpsertTotals = (tx: SqlClient) =>
    tx<TotalsRow>`
      INSERT INTO profile_vote_totals (
        profile_key,
        likes,
        dislikes,
        first_vote_at,
        last_vote_at,
        updated_at
      )
      VALUES (
        ${normalized.key},
        ${direction === "like" ? 1 : 0},
        ${direction === "dislike" ? 1 : 0},
        ${createdAt.toISOString()},
        ${createdAt.toISOString()},
        ${createdAt.toISOString()}
      )
      ON CONFLICT (profile_key)
      DO UPDATE SET
        likes = profile_vote_totals.likes + EXCLUDED.likes,
        dislikes = profile_vote_totals.dislikes + EXCLUDED.dislikes,
        first_vote_at = COALESCE(profile_vote_totals.first_vote_at, EXCLUDED.first_vote_at),
        last_vote_at = EXCLUDED.last_vote_at,
        updated_at = EXCLUDED.updated_at
      RETURNING profile_key, likes, dislikes, first_vote_at, last_vote_at, updated_at;
    `;

  const clientWithExtras = client as SqlClient & {
    begin?: SqlClient["begin"];
    transaction?: SqlClient["transaction"];
  };

  let totalsRow: TotalsRow | undefined;

  if (typeof clientWithExtras.transaction === "function") {
    const results = (await clientWithExtras.transaction((tx: SqlClient) => [
      runInsertVote(tx),
      runUpsertTotals(tx),
    ])) as unknown[];
    const totalsRows = Array.isArray(results) ? (results[1] as TotalsRow[]) : undefined;
    totalsRow = totalsRows?.[0];
  } else if (typeof clientWithExtras.begin === "function") {
    totalsRow = await clientWithExtras.begin(async (tx: SqlClient) => {
      await runInsertVote(tx);
      const rows = await runUpsertTotals(tx);
      const record = rows[0];
      if (!record) {
        throw new Error("Failed to persist vote totals");
      }
      return record;
    });
  } else {
    throw new Error("SQL client does not support transactional operations");
  }

  if (!totalsRow) {
    throw new Error("Failed to persist vote totals");
  }

  const baseTotals = mapTotalsRow(totalsRow);
  return buildProfileVoteTotals(client, normalized, baseTotals, createdAt);
}

export async function fetchProfileVoteTotals({
  profile,
  sql,
  databaseUrl,
}: FetchTotalsParams): Promise<ProfileVoteTotals | null> {
  const normalized =
    typeof profile === "string"
      ? parseProfileKey(profile)
      : normalizeProfileIdentifier(profile);
  const client = getSqlClient(sql, databaseUrl);

  const rows = await client<TotalsRow>`
    SELECT profile_key, likes, dislikes, first_vote_at, last_vote_at, updated_at
    FROM profile_vote_totals
    WHERE profile_key = ${normalized.key}
    LIMIT 1;
  `;
  const record = rows[0];
  if (!record) return null;

  const baseTotals = mapTotalsRow(record);
  return buildProfileVoteTotals(client, normalized, baseTotals, new Date());
}

type TopTotalsParams = {
  order: "likes" | "dislikes";
  limit?: number;
  sql?: SqlClient;
  databaseUrl?: string;
};

export async function listTopProfileVoteTotals({
  order,
  limit = 25,
  sql,
  databaseUrl,
}: TopTotalsParams): Promise<ProfileVoteTotals[]> {
  const client = getSqlClient(sql, databaseUrl);
  const rows =
    order === "likes"
      ? await client<TotalsRow>`
          SELECT profile_key, likes, dislikes, first_vote_at, last_vote_at, updated_at
          FROM profile_vote_totals
          WHERE likes > 0
          ORDER BY likes DESC, profile_key ASC
          LIMIT ${limit};
        `
      : await client<TotalsRow>`
          SELECT profile_key, likes, dislikes, first_vote_at, last_vote_at, updated_at
          FROM profile_vote_totals
          WHERE dislikes > 0
          ORDER BY dislikes DESC, profile_key ASC
          LIMIT ${limit};
        `;

  const results: ProfileVoteTotals[] = [];
  for (const row of rows) {
    try {
      const normalized = parseProfileKey(row.profile_key);
      const baseTotals = mapTotalsRow(row);
      const totals = await buildProfileVoteTotals(
        client,
        normalized,
        baseTotals,
        new Date()
      );
      results.push(totals);
    } catch {
      // Skip malformed rows; aggregation should proceed with valid entries.
    }
  }
  return results;
}

type VoteSummaryRow = {
  total_profiles: number | string | null;
  total_likes: number | string | null;
  total_dislikes: number | string | null;
};

export type VoteSummary = {
  totalProfiles: number;
  totalLikes: number;
  totalDislikes: number;
};

export async function fetchVoteSummary({
  sql,
  databaseUrl,
}: {
  sql?: SqlClient;
  databaseUrl?: string;
} = {}): Promise<VoteSummary> {
  const client = getSqlClient(sql, databaseUrl);
  const rows = await client<VoteSummaryRow>`
    SELECT
      COUNT(*) AS total_profiles,
      COALESCE(SUM(likes), 0) AS total_likes,
      COALESCE(SUM(dislikes), 0) AS total_dislikes
    FROM profile_vote_totals;
  `;
  const record = rows[0];
  return {
    totalProfiles: coerceNumber(record?.total_profiles ?? 0),
    totalLikes: coerceNumber(record?.total_likes ?? 0),
    totalDislikes: coerceNumber(record?.total_dislikes ?? 0),
  };
}
