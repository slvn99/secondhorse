import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import LeaderboardClient from "@/app/leaderboard/LeaderboardClient";
import type { LeaderboardResponse } from "@/lib/voteTypes";

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, ...props }: { children: React.ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}));

afterEach(() => {
  cleanup();
});

function buildResponse(overrides: Partial<LeaderboardResponse> = {}): LeaderboardResponse {
  return {
    summary: {
      totalProfiles: 3,
      totalLikes: 12,
      totalDislikes: 4,
      generatedAt: new Date("2025-01-01T00:00:00Z").toISOString(),
    },
    likes: [
      {
        profileKey: "db:123",
        source: "db",
        id: "123",
        likes: 10,
        dislikes: 2,
        profileAgeDays: 25,
        profileCreatedAt: new Date("2024-12-01T00:00:00Z").toISOString(),
        firstVoteAt: new Date("2024-12-05T00:00:00Z").toISOString(),
        lastVoteAt: new Date("2024-12-20T00:00:00Z").toISOString(),
        updatedAt: new Date("2024-12-20T00:00:00Z").toISOString(),
        rank: 1,
        directionCount: 10,
        displayName: "Thunder",
        imageUrl: "https://example.com/thunder.jpg",
      },
    ],
    dislikes: [
      {
        profileKey: "seed:abc",
        source: "seed",
        id: "abc",
        likes: 2,
        dislikes: 4,
        profileAgeDays: 12,
        profileCreatedAt: null,
        firstVoteAt: new Date("2024-12-15T00:00:00Z").toISOString(),
        lastVoteAt: new Date("2024-12-18T00:00:00Z").toISOString(),
        updatedAt: new Date("2024-12-18T00:00:00Z").toISOString(),
        rank: 1,
        directionCount: 4,
        displayName: "Grumpy",
        imageUrl: null,
      },
    ],
    ...overrides,
  };
}

describe("LeaderboardClient", () => {
  it("renders summary metrics and default likes tab", () => {
    render(<LeaderboardClient data={buildResponse()} />);

    expect(screen.getByText("Leaderboard")).toBeTruthy();
    expect(screen.getByText("Active profiles")).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();
    expect(screen.getByText("Most Liked").getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("Thunder")).toBeTruthy();
    expect(screen.getByText("Likes: 10")).toBeTruthy();
  });

  it("switches to the dislikes tab when selected", async () => {
    render(<LeaderboardClient data={buildResponse()} />);

    const [dislikesTab] = screen.getAllByRole("tab", { name: "Most Disliked" });
    fireEvent.click(dislikesTab);

    await waitFor(() => {
      expect(dislikesTab.getAttribute("aria-selected")).toBe("true");
      expect(screen.getByText("Grumpy")).toBeTruthy();
    });
  });

  it("shows empty state when there are no entries", async () => {
    const emptyData: LeaderboardResponse = {
      summary: {
        totalProfiles: 0,
        totalLikes: 0,
        totalDislikes: 0,
        generatedAt: new Date("2025-01-01T00:00:00Z").toISOString(),
      },
      likes: [],
      dislikes: [],
    };

    render(<LeaderboardClient data={emptyData} />);

    expect(screen.getByText(/No likes yet/i)).toBeTruthy();

    const [dislikesTab] = screen.getAllByRole("tab", { name: "Most Disliked" });
    fireEvent.click(dislikesTab);

    await waitFor(() => {
      const dislikesPanel = screen
        .getAllByRole("tabpanel")
        .find((element) => element.getAttribute("aria-labelledby") === "dislikes-tab");
      expect((dislikesPanel?.textContent ?? "").includes("No dislikes yet")).toBe(true);
    });
  });
});
