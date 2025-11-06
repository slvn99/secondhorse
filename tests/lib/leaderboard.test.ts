import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateLeaderboard } from "@/lib/leaderboard";
import { horses } from "@/lib/horses";
import { stableIdForName } from "@/lib/profileIds";
import type { ProfileVoteTotals, SqlClient, VoteSummary } from "@/lib/profileVotes";
import { fetchVoteSummary, listTopProfileVoteTotals } from "@/lib/profileVotes";

vi.mock("@/lib/profileVotes", () => ({
  listTopProfileVoteTotals: vi.fn(),
  fetchVoteSummary: vi.fn(),
}));

const mockedListTopProfileVoteTotals = vi.mocked(listTopProfileVoteTotals);
const mockedFetchVoteSummary = vi.mocked(fetchVoteSummary);

describe("generateLeaderboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches database metadata in a single batched query while preserving seed fallbacks", async () => {
    const dbId = "123e4567-e89b-12d3-a456-426614174000";
    const seedHorse = horses[0];
    const seedId = stableIdForName(seedHorse.name);

    const likes: ProfileVoteTotals[] = [
      {
        profileKey: `db:${dbId}`,
        source: "db",
        id: dbId,
        likes: 42,
        dislikes: 3,
        firstVoteAt: null,
        lastVoteAt: null,
        updatedAt: null,
        profileCreatedAt: null,
        profileAgeDays: 0,
      },
      {
        profileKey: `seed:${seedId}`,
        source: "seed",
        id: seedId,
        likes: 30,
        dislikes: 1,
        firstVoteAt: null,
        lastVoteAt: null,
        updatedAt: null,
        profileCreatedAt: null,
        profileAgeDays: 0,
      },
    ];

    const dislikes: ProfileVoteTotals[] = [
      {
        profileKey: `db:${dbId}`,
        source: "db",
        id: dbId,
        likes: 5,
        dislikes: 20,
        firstVoteAt: null,
        lastVoteAt: null,
        updatedAt: null,
        profileCreatedAt: null,
        profileAgeDays: 0,
      },
    ];

    const summary: VoteSummary = {
      totalProfiles: 2,
      totalLikes: 47,
      totalDislikes: 21,
    };

    mockedListTopProfileVoteTotals.mockImplementation(async ({ order }) => {
      return order === "likes" ? likes : dislikes;
    });
    mockedFetchVoteSummary.mockResolvedValue(summary);

    const sqlCalls: Array<{ text: string; values: any[] }> = [];
    const fakeSql = (async (strings: TemplateStringsArray, ...values: any[]) => {
      const text = strings.join(" ").replace(/\s+/g, " ").trim();
      sqlCalls.push({ text, values });
      if (text.startsWith("SELECT p.id, p.display_name")) {
        return [
          {
            id: dbId,
            display_name: "DB Rocket",
            image_url: "https://example.com/db-rocket.jpg",
          },
        ];
      }
      throw new Error(`Unexpected query: ${text}`);
    }) as SqlClient;

    const result = await generateLeaderboard({ sql: fakeSql, limit: 10 });

    expect(sqlCalls).toHaveLength(1);
    expect(sqlCalls[0].values[0]).toEqual([dbId]);

    const dbLike = result.likes.find((entry) => entry.id === dbId);
    expect(dbLike).toMatchObject({
      displayName: "DB Rocket",
      imageUrl: "https://example.com/db-rocket.jpg",
      directionCount: 42,
      rank: 1,
    });

    const seedLike = result.likes.find((entry) => entry.id === seedId);
    expect(seedLike).toMatchObject({
      displayName: seedHorse.name,
      imageUrl: seedHorse.image ?? null,
      directionCount: 30,
    });

    const dbDislike = result.dislikes.find((entry) => entry.id === dbId);
    expect(dbDislike?.directionCount).toBe(20);

    expect(result.summary).toMatchObject({
      totalProfiles: 2,
      totalLikes: 47,
      totalDislikes: 21,
    });
  });
});
