import { describe, it, expect, beforeEach, vi } from "vitest";

const mockRateLimit = vi.hoisted(() =>
  vi.fn(() => ({ allowed: true, remaining: 5 }))
);

const mockRecordProfileVote = vi.hoisted(() => vi.fn());
const mockRecordFlaggedVoteAttempt = vi.hoisted(() => vi.fn());
const mockListTop = vi.hoisted(() => vi.fn());
const mockFetchSummary = vi.hoisted(() => vi.fn());

const mockSql = vi.hoisted(() => {
  const executor = async () => [] as any[];
  (executor as any).begin = async (callback: (sql: any) => Promise<any>) =>
    callback(executor);
  return executor;
});

vi.mock("@/app/_lib/rateLimit", () => ({
  rateLimit: mockRateLimit,
}));

vi.mock("@/lib/profileVotes", () => ({
  recordProfileVote: mockRecordProfileVote,
  recordFlaggedVoteAttempt: mockRecordFlaggedVoteAttempt,
  listTopProfileVoteTotals: mockListTop,
  fetchVoteSummary: mockFetchSummary,
}));

const mockEvaluateGuard = vi.hoisted(() => vi.fn(async () => ({ status: "allow" as const })));
const mockHashClientIdentifier = vi.hoisted(() => vi.fn((value: string | null) => (value ? `hash:${value}` : null)));

vi.mock("@/lib/voteGuard", () => ({
  evaluateVoteGuard: mockEvaluateGuard,
  hashClientIdentifier: mockHashClientIdentifier,
}));

const mockNeon = vi.hoisted(() => vi.fn(() => mockSql));
vi.mock("@neondatabase/serverless", () => ({
  neon: mockNeon,
}));

import type { ProfileVoteTotals, VoteSummary } from "@/lib/profileVotes";
import { stableIdForName } from "@/lib/profileIds";
import { POST as votePost } from "@/app/api/profiles/[id]/vote/route";
import { GET as leaderboardGet } from "@/app/api/leaderboard/route";

beforeEach(() => {
  mockRateLimit.mockReset();
  mockRateLimit.mockImplementation(() => ({ allowed: true, remaining: 5 }));
  mockRecordProfileVote.mockReset();
  mockListTop.mockReset();
  mockFetchSummary.mockReset();
  mockNeon.mockClear();
  mockRecordFlaggedVoteAttempt.mockReset();
  mockEvaluateGuard.mockReset();
  mockEvaluateGuard.mockResolvedValue({ status: "allow" });
  mockHashClientIdentifier.mockClear();
  delete process.env.DATABASE_URL;
});

function createTotals(overrides: Partial<ProfileVoteTotals> = {}): ProfileVoteTotals {
  const defaults: ProfileVoteTotals = {
    profileKey: "db:123e4567-e89b-12d3-a456-426614174000",
    source: "db",
    id: "123e4567-e89b-12d3-a456-426614174000",
    likes: 3,
    dislikes: 1,
    firstVoteAt: new Date("2025-01-01T00:00:00Z"),
    lastVoteAt: new Date("2025-01-10T00:00:00Z"),
    updatedAt: new Date("2025-01-10T00:00:00Z"),
    profileCreatedAt: new Date("2024-12-01T00:00:00Z"),
    profileAgeDays: 40,
  };
  return { ...defaults, ...overrides };
}

describe("POST /api/profiles/[id]/vote", () => {
  it("records a vote for a database profile", async () => {
    const totals = createTotals();
    mockRecordProfileVote.mockResolvedValue(totals);
    const request = new Request("http://test/api/profiles/123e4567-e89b-12d3-a456-426614174000/vote", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "10.0.0.5" },
      body: JSON.stringify({ direction: "like" }),
    });

    const response = await votePost(request, {
      params: { id: "123e4567-e89b-12d3-a456-426614174000" },
    });

    expect(mockRateLimit).toHaveBeenCalled();
    expect(mockHashClientIdentifier).toHaveBeenCalledWith("10.0.0.5");
    expect(mockEvaluateGuard).toHaveBeenCalledWith({
      clientHash: "hash:10.0.0.5",
      profileKey: "db:123e4567-e89b-12d3-a456-426614174000",
    });
    expect(mockRecordProfileVote).toHaveBeenCalledWith(
      expect.objectContaining({
        profile: { dbId: "123e4567-e89b-12d3-a456-426614174000" },
        direction: "like",
        clientHash: "hash:10.0.0.5",
      })
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.totals.likes).toBe(3);
    expect(body.totals.profileKey).toBe("db:123e4567-e89b-12d3-a456-426614174000");
  });

  it("rejects requests that exceed the rate limit", async () => {
    mockRateLimit.mockReturnValueOnce({ allowed: false, remaining: 0 });
    const request = new Request("http://test/api/profiles/seed/vote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ direction: "like", profileType: "seed", seedName: "Star" }),
    });

    const response = await votePost(request, {
      params: { id: stableIdForName("Star") },
    });

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.error.message).toContain("Too many votes");
    expect(mockRecordProfileVote).not.toHaveBeenCalled();
  });

  it("returns validation error for malformed payloads", async () => {
    const request = new Request("http://test/api/profiles/invalid/vote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ wrong: "data" }),
    });

    const response = await votePost(request, { params: { id: "invalid" } });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.message).toBe("Invalid vote payload");
  });
});

describe("GET /api/leaderboard", () => {
  it("returns 503 when no database is configured", async () => {
    const response = await leaderboardGet();
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error.message).toContain("database not configured");
  });

  it("returns leaderboard data when votes exist", async () => {
    process.env.DATABASE_URL = "postgres://example";
    const dbTotals = createTotals();
    const seedTotals = createTotals({
      profileKey: `seed:${stableIdForName("Star")}`,
      source: "seed",
      id: stableIdForName("Star"),
      likes: 7,
      dislikes: 2,
    });
    mockListTop.mockResolvedValueOnce([dbTotals]).mockResolvedValueOnce([seedTotals]);
    const summary: VoteSummary = { totalProfiles: 2, totalLikes: 10, totalDislikes: 3 };
    mockFetchSummary.mockResolvedValue(summary);

    const response = await leaderboardGet();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.summary.totalProfiles).toBe(2);
    expect(body.likes[0].directionCount).toBe(3);
    expect(body.dislikes[0].displayName).toBe("Star");
    expect(mockNeon).toHaveBeenCalledWith("postgres://example");
  });
});
