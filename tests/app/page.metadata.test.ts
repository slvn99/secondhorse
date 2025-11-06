import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Horse } from "@/lib/horses";
import { stableIdForName } from "@/lib/profileIds";
import { horses as seedHorses } from "@/lib/horses";

const { loadHorseForProfileKeyMock } = vi.hoisted(() => ({
  loadHorseForProfileKeyMock: vi.fn(async (_id: string) => ({
    horse: null as Horse | null,
    identifier: null,
  })),
}));

vi.mock("@/lib/brokenFeatureFlags", () => ({
  loadFeatureFlagsForRuntime: vi.fn(() => ({})),
}));

vi.mock("@/lib/profileLookup", () => ({
  loadHorseForProfileKey: loadHorseForProfileKeyMock,
  listSeedProfileParams: vi.fn(() => []),
}));

// Import after mocks so the page module sees the mocked dependencies.
import { generateMetadata, defaultHomeMetadata } from "@/app/page";

describe("home page generateMetadata", () => {
  beforeEach(() => {
    loadHorseForProfileKeyMock.mockReset();
    loadHorseForProfileKeyMock.mockImplementation(async () => ({
      horse: null,
      identifier: null,
    }));
  });

  it("returns base metadata when no profile query is supplied", async () => {
    const result = await generateMetadata({ searchParams: {} });
    expect(result).toEqual(defaultHomeMetadata);
    expect(loadHorseForProfileKeyMock).not.toHaveBeenCalled();
  });

  it("populates metadata for a seed horse profile", async () => {
    const sample = seedHorses.find((horse) => horse.name === "Marlin");
    if (!sample) {
      throw new Error("Seed horse Marlin is required for the test.");
    }
    const hash = stableIdForName(sample.name);
    const profileKey = `seed:${hash}`;

    loadHorseForProfileKeyMock.mockImplementation(async (raw) => {
      if (raw === profileKey) {
        return {
          horse: sample,
          identifier: { key: profileKey, source: "seed" as const, id: hash },
        };
      }
      return { horse: null, identifier: null };
    });

    const result = await generateMetadata({
      searchParams: { profile: profileKey },
    });

    expect(result.title).toBe(`${sample.name} | Second Horse Dating`);
    expect(result.description).toContain(sample.description.slice(0, 10));
    expect(result.openGraph?.images?.[0]?.url).toBe(sample.image);
    expect(loadHorseForProfileKeyMock).toHaveBeenCalledWith(profileKey);
  });

  it("falls back to database horse metadata when provided a db id", async () => {
    const dbHorse: Horse = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Glacier",
      age: 8,
      breed: "Hanoverian",
      location: "Reykjavik, Iceland",
      gender: "Gelding",
      heightCm: 162,
      color: "Grey",
      temperament: "Calm",
      disciplines: ["dressage"],
      interests: ["winter hacks"],
      description: "Elegant database horse ready for the spotlight.",
      image: "https://example.com/glacier.png",
      photos: undefined,
    };

    loadHorseForProfileKeyMock.mockImplementation(async (raw) => {
      if (raw === dbHorse.id) {
        return {
          horse: dbHorse,
          identifier: {
            key: `db:${dbHorse.id.toLowerCase()}`,
            source: "db" as const,
            id: dbHorse.id.toLowerCase(),
          },
        };
      }
      return { horse: null, identifier: null };
    });

    const result = await generateMetadata({
      searchParams: { id: dbHorse.id },
    });

    expect(loadHorseForProfileKeyMock).toHaveBeenCalledWith(dbHorse.id);
    expect(result.title).toBe(`${dbHorse.name} | Second Horse Dating`);
    expect(result.twitter?.images?.[0]).toBe(dbHorse.image);
    expect(result.description).toContain("Elegant database horse");
  });
});
