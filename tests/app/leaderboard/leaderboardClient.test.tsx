import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import LeaderboardClient from "@/app/leaderboard/LeaderboardClient";
import { TfhProvider } from "@/lib/tfh";
import type { LeaderboardResponse } from "@/lib/voteTypes";

const dbProfileResponse = {
  horse: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    name: "Thunder",
    age: 10,
    breed: "Warmblood",
    location: "Stable",
    gender: "Gelding",
    heightCm: 165,
    color: "Gray",
    temperament: "Calm",
    disciplines: ["Dressage"],
    interests: ["Carrots"],
    description: "Champion horse",
    image: "/TFH/Tinder-for-Horses-cover-image.png",
    photos: ["/TFH/Tinder-for-Horses-cover-image.png"],
  },
};

const seedProfileResponse = {
  horse: {
    id: "seed:65c4ed6c",
    name: "Grumpy",
    age: 8,
    breed: "Draft",
    location: "Barn",
    gender: "Gelding",
    heightCm: 160,
    color: "Chestnut",
    temperament: "Feisty",
    disciplines: ["Trail"],
    interests: ["Apples"],
    description: "Seed profile",
    image: "/TFH/Tinder-for-Horses-cover-image.png",
    photos: ["/TFH/Tinder-for-Horses-cover-image.png"],
  },
};

const originalLocation = window.location;
const mockLocation: any = {
  href: "http://localhost/leaderboard",
  origin: "http://localhost",
  protocol: "http:",
  host: "localhost",
  hostname: "localhost",
  port: "",
  pathname: "/leaderboard",
  search: "",
  hash: "",
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
  ancestorOrigins: { length: 0 },
  toString() {
    return this.href;
  },
};

function updateMockLocation(url: string) {
  try {
    const parsed = new URL(url, mockLocation.origin);
    mockLocation.href = parsed.toString();
    mockLocation.origin = parsed.origin;
    mockLocation.protocol = parsed.protocol;
    mockLocation.host = parsed.host;
    mockLocation.hostname = parsed.hostname;
    mockLocation.port = parsed.port;
    mockLocation.pathname = parsed.pathname;
    mockLocation.search = parsed.search;
    mockLocation.hash = parsed.hash;
  } catch {
    // ignore invalid URLs during tests
  }
}

let replaceStateMock: ReturnType<typeof vi.spyOn> | null = null;

beforeAll(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: mockLocation,
  });
});

afterAll(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: originalLocation,
  });
});

beforeEach(() => {
  vi.spyOn(global, "fetch").mockImplementation(async (input: RequestInfo) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("seed%3A65c4ed6c")) {
      return {
        ok: true,
        json: async () => seedProfileResponse,
      } as Response;
    }
    if (url.includes("db%3A123e4567-e89b-12d3-a456-426614174000")) {
      return {
        ok: true,
        json: async () => dbProfileResponse,
      } as Response;
    }
    return {
      ok: false,
      status: 404,
      json: async () => ({ error: "not found" }),
    } as Response;
  });
  updateMockLocation("http://localhost/leaderboard");
  replaceStateMock = vi.spyOn(window.history, "replaceState").mockImplementation((_state, _title, url) => {
    if (typeof url === "string") {
      updateMockLocation(url);
    }
  });
});

afterEach(() => {
  replaceStateMock?.mockRestore();
  replaceStateMock = null;
  vi.restoreAllMocks();
  cleanup();
});

function renderWithProvider(element: React.ReactElement) {
  return render(<TfhProvider>{element}</TfhProvider>);
}

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
        profileKey: "db:123e4567-e89b-12d3-a456-426614174000",
        source: "db",
        id: "123e4567-e89b-12d3-a456-426614174000",
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
        profileKey: "seed:65c4ed6c",
        source: "seed",
        id: "65c4ed6c",
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
    renderWithProvider(<LeaderboardClient data={buildResponse()} />);

    expect(screen.getByText("Leaderboard")).toBeTruthy();
    expect(screen.getByText("Active profiles")).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();
    expect(screen.getByText("Most Liked").getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("Thunder")).toBeTruthy();
    expect(screen.getByText("Likes: 10")).toBeTruthy();
  });

  it("switches to the dislikes tab when selected", async () => {
    renderWithProvider(<LeaderboardClient data={buildResponse()} />);

    const [dislikesTab] = screen.getAllByRole("tab", { name: "Most Disliked" });
    fireEvent.click(dislikesTab);

    await waitFor(() => {
      expect(dislikesTab.getAttribute("aria-selected")).toBe("true");
      expect(screen.getByText("Grumpy")).toBeTruthy();
    });
  });

  it("opens the profile modal for database-backed entries", async () => {
    renderWithProvider(<LeaderboardClient data={buildResponse()} />);

    const button = await screen.findByRole("button", { name: "View Thunder" });
    fireEvent.click(button);

    const modal = await screen.findByTestId("profile-modal");
    expect(modal).toBeTruthy();
    expect(screen.getByText("Thunder, 10")).toBeTruthy();
    expect((global.fetch as unknown as vi.Mock).mock.calls[0]?.[0]).toContain("db%3A123e4567-e89b-12d3-a456-426614174000");
    await waitFor(() => {
      expect(window.location.pathname).toBe("/leaderboard");
      expect(window.location.search).toContain("profile=db%3A123e4567-e89b-12d3-a456-426614174000");
    });

    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    await waitFor(() => {
      expect(screen.queryByTestId("profile-modal")).toBeNull();
      expect(window.location.search).toBe("");
    });
  });

  it("opens the profile modal for seed entries", async () => {
    renderWithProvider(<LeaderboardClient data={buildResponse()} />);
    const [dislikesTab] = screen.getAllByRole("tab", { name: "Most Disliked" });
    fireEvent.click(dislikesTab);

    const button = await screen.findByRole("button", { name: "View Grumpy" });
    fireEvent.click(button);

    const modal = await screen.findByTestId("profile-modal");
    expect(modal).toBeTruthy();
    expect(screen.getByText("Grumpy, 8")).toBeTruthy();
    expect((global.fetch as unknown as vi.Mock).mock.calls[0]?.[0]).toContain("seed%3A65c4ed6c");
    await waitFor(() => {
      expect(window.location.search).toContain("profile=seed%3A65c4ed6c");
    });
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    await waitFor(() => expect(window.location.search).toBe(""));
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

    renderWithProvider(<LeaderboardClient data={emptyData} />);

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

  it("opens the profile modal when the profile query parameter is present", async () => {
    updateMockLocation("http://localhost/leaderboard?profile=seed%3A65c4ed6c");
    renderWithProvider(<LeaderboardClient data={buildResponse()} />);

    const modal = await screen.findByTestId("profile-modal");
    expect(modal).toBeTruthy();
    await waitFor(() => {
      expect(window.location.pathname).toBe("/leaderboard");
      expect(window.location.search).toContain("profile=seed%3A65c4ed6c");
    });
  });
});



