import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { LeaderboardResponse } from "@/lib/voteTypes";

vi.mock("@/lib/leaderboard", () => ({
  generateLeaderboard: vi.fn(),
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, ...props }: { children: React.ReactNode }) => <a {...props}>{children}</a>,
}));

import LeaderboardPage from "@/app/leaderboard/page";
import { generateLeaderboard } from "@/lib/leaderboard";

const mockGenerateLeaderboard = vi.mocked(generateLeaderboard);

const sampleResponse: LeaderboardResponse = {
  summary: {
    totalProfiles: 2,
    totalLikes: 5,
    totalDislikes: 1,
    generatedAt: new Date("2025-01-01T00:00:00Z").toISOString(),
  },
  likes: [
    {
      profileKey: "db:123e4567-e89b-12d3-a456-426614174000",
      source: "db",
      id: "123e4567-e89b-12d3-a456-426614174000",
      likes: 5,
      dislikes: 1,
      profileAgeDays: 10,
      profileCreatedAt: new Date("2024-12-20T00:00:00Z").toISOString(),
      firstVoteAt: new Date("2024-12-21T00:00:00Z").toISOString(),
      lastVoteAt: new Date("2024-12-29T00:00:00Z").toISOString(),
      updatedAt: new Date("2024-12-29T00:00:00Z").toISOString(),
      rank: 1,
      directionCount: 5,
      displayName: "Thunder",
      imageUrl: null,
    },
  ],
  dislikes: [
    {
      profileKey: "seed:65c4ed6c",
      source: "seed",
      id: "65c4ed6c",
      likes: 0,
      dislikes: 3,
      profileAgeDays: 12,
      profileCreatedAt: null,
      firstVoteAt: new Date("2024-12-25T00:00:00Z").toISOString(),
      lastVoteAt: new Date("2024-12-26T00:00:00Z").toISOString(),
      updatedAt: new Date("2024-12-26T00:00:00Z").toISOString(),
      rank: 1,
      directionCount: 3,
      displayName: "Grumpy",
      imageUrl: null,
    },
  ],
};

describe("LeaderboardPage", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgres://example";
    mockGenerateLeaderboard.mockResolvedValue(sampleResponse);
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
    mockGenerateLeaderboard.mockReset();
  });

  it("wraps leaderboard content in a scroll container", async () => {
    const element = await LeaderboardPage();
    render(<>{element}</>);

    expect(screen.getByTestId("leaderboard-scroll-container")).toBeTruthy();
  });
});
