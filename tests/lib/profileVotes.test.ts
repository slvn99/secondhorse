import { describe, expect, it } from "vitest";
import {
  recordProfileVote,
  fetchProfileVoteTotals,
  profileAgeInDays,
  type SqlClient,
  type VoteDirection,
} from "@/lib/profileVotes";
import { normalizeProfileIdentifier, stableIdForName } from "@/lib/profileIds";

type TotalsState = {
  likes: number;
  dislikes: number;
  firstVoteAt: Date | null;
  lastVoteAt: Date | null;
  updatedAt: Date | null;
};

type FakeOptions = {
  profileCreatedAt?: Record<string, string | Date>;
};

function createFakeSqlClient(options: FakeOptions = {}) {
  const totals = new Map<string, TotalsState>();
  const profileCreatedAt = new Map<string, Date>();
  const votes: Array<{ profileKey: string; direction: VoteDirection; createdAt: Date }> = [];

  for (const [id, value] of Object.entries(options.profileCreatedAt ?? {})) {
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isNaN(date.getTime())) {
      profileCreatedAt.set(id.toLowerCase(), date);
    }
  }

  const sql = (async (strings: TemplateStringsArray, ...values: any[]) => {
    const raw = strings.join(" ").replace(/\s+/g, " ").trim();
    if (raw.startsWith("INSERT INTO profile_votes")) {
      const [profileKey, direction, createdAtIso] = values as [string, VoteDirection, string];
      const createdAt = new Date(createdAtIso);
      votes.push({ profileKey, direction, createdAt });
      return [];
    }
    if (raw.startsWith("INSERT INTO profile_vote_totals")) {
      const [
        profileKey,
        likeIncrement,
        dislikeIncrement,
        firstVoteIso,
        lastVoteIso,
        updatedIso,
      ] = values as [string, number, number, string, string, string];
      const entry: TotalsState = totals.get(profileKey) ?? {
        likes: 0,
        dislikes: 0,
        firstVoteAt: null,
        lastVoteAt: null,
        updatedAt: null,
      };
      entry.likes += Number(likeIncrement);
      entry.dislikes += Number(dislikeIncrement);
      const firstVoteAt = new Date(firstVoteIso);
      if (!entry.firstVoteAt || firstVoteAt < entry.firstVoteAt) {
        entry.firstVoteAt = firstVoteAt;
      }
      entry.lastVoteAt = new Date(lastVoteIso);
      entry.updatedAt = new Date(updatedIso);
      totals.set(profileKey, entry);
      return [
        {
          profile_key: profileKey,
          likes: entry.likes,
          dislikes: entry.dislikes,
          first_vote_at: entry.firstVoteAt?.toISOString() ?? null,
          last_vote_at: entry.lastVoteAt?.toISOString() ?? null,
          updated_at: entry.updatedAt?.toISOString() ?? null,
        },
      ];
    }
    if (raw.startsWith("SELECT profile_key")) {
      const [profileKey] = values as [string];
      const entry = totals.get(profileKey);
      if (!entry) return [];
      return [
        {
          profile_key: profileKey,
          likes: entry.likes,
          dislikes: entry.dislikes,
          first_vote_at: entry.firstVoteAt?.toISOString() ?? null,
          last_vote_at: entry.lastVoteAt?.toISOString() ?? null,
          updated_at: entry.updatedAt?.toISOString() ?? null,
        },
      ];
    }
    if (raw.startsWith("SELECT created_at")) {
      const [id] = values as [string];
      const record = profileCreatedAt.get(id.toLowerCase());
      if (!record) return [];
      return [{ created_at: record.toISOString() }];
    }
    throw new Error(`Unexpected query in fake SQL client: ${raw}`);
  }) as SqlClient;

  sql.begin = async <T>(callback: (inner: SqlClient) => Promise<T>) => callback(sql);
  sql.transaction = async (queriesOrFactory: Array<Promise<unknown>> | ((inner: SqlClient) => Array<Promise<unknown>>)) => {
    const queries =
      typeof queriesOrFactory === "function" ? queriesOrFactory(sql) : queriesOrFactory;
    const results: unknown[] = [];
    for (const query of queries) {
      results.push(await query);
    }
    return results;
  };

  return { sql, totals, profileCreatedAt, votes };
}

describe("profile identifier normalization", () => {
  it("normalizes database UUIDs with db prefix", () => {
    const normalized = normalizeProfileIdentifier({ dbId: "9F6A0B45-5EAF-4E03-AF35-8B010BEA3D32" });
    expect(normalized).toMatchObject({
      key: "db:9f6a0b45-5eaf-4e03-af35-8b010bea3d32",
      source: "db",
      id: "9f6a0b45-5eaf-4e03-af35-8b010bea3d32",
    });
  });

  it("derives seeded identifiers from name hashes", () => {
    const normalized = normalizeProfileIdentifier({ seedName: "Demo Horse" });
    expect(normalized.source).toBe("seed");
    expect(normalized.key.startsWith("seed:")).toBe(true);
    const expectedHash = stableIdForName("Demo Horse");
    expect(normalized.key).toBe(`seed:${expectedHash}`);
  });
});

describe("profile vote persistence helpers", () => {
  it("records votes and aggregates totals for database-backed profiles", async () => {
    const dbId = "123e4567-e89b-12d3-a456-426614174000";
    const createdAt = new Date("2024-12-15T00:00:00Z");
    const likeTime = new Date("2025-01-01T00:00:00Z");
    const dislikeTime = new Date("2025-01-05T12:00:00Z");
    const fake = createFakeSqlClient({ profileCreatedAt: { [dbId]: createdAt } });

    const first = await recordProfileVote({
      profile: { dbId },
      direction: "like",
      timestamp: likeTime,
      sql: fake.sql,
    });

    expect(first.likes).toBe(1);
    expect(first.dislikes).toBe(0);
    expect(first.firstVoteAt?.toISOString()).toBe(likeTime.toISOString());
    expect(first.profileCreatedAt?.toISOString()).toBe(createdAt.toISOString());
    expect(first.profileAgeDays).toBe(
      profileAgeInDays({ profileCreatedAt: createdAt, firstVoteAt: likeTime, now: likeTime })
    );

    const second = await recordProfileVote({
      profile: { dbId },
      direction: "dislike",
      timestamp: dislikeTime,
      sql: fake.sql,
    });

    expect(second.likes).toBe(1);
    expect(second.dislikes).toBe(1);
    expect(second.firstVoteAt?.toISOString()).toBe(likeTime.toISOString());
    expect(second.lastVoteAt?.toISOString()).toBe(dislikeTime.toISOString());
    expect(second.profileAgeDays).toBe(
      profileAgeInDays({
        profileCreatedAt: createdAt,
        firstVoteAt: likeTime,
        now: dislikeTime,
      })
    );

    const totals = await fetchProfileVoteTotals({ profile: { dbId }, sql: fake.sql });
    expect(totals).not.toBeNull();
    expect(totals?.likes).toBe(1);
    expect(totals?.dislikes).toBe(1);
    expect(totals?.profileAgeDays).toBe(
      profileAgeInDays({
        profileCreatedAt: createdAt,
        firstVoteAt: likeTime,
        now: totals?.updatedAt ?? dislikeTime,
      })
    );
  });

  it("falls back to first vote timestamp for seeded profiles without created_at", async () => {
    const seedName = "Seeded Horse";
    const firstVote = new Date("2025-02-01T09:30:00Z");
    const fake = createFakeSqlClient();

    const result = await recordProfileVote({
      profile: { seedName },
      direction: "dislike",
      timestamp: firstVote,
      sql: fake.sql,
    });

    expect(result.profileCreatedAt).toBeNull();
    expect(result.firstVoteAt?.toISOString()).toBe(firstVote.toISOString());
    expect(result.profileAgeDays).toBe(
      profileAgeInDays({ profileCreatedAt: null, firstVoteAt: firstVote, now: firstVote })
    );

    const totals = await fetchProfileVoteTotals({
      profile: { seedId: stableIdForName(seedName) },
      sql: fake.sql,
    });

    expect(totals?.dislikes).toBe(1);
    expect(totals?.likes).toBe(0);
    expect(totals?.profileAgeDays).toBe(
      profileAgeInDays({ profileCreatedAt: null, firstVoteAt: firstVote, now: totals?.updatedAt ?? firstVote })
    );
  });
});
