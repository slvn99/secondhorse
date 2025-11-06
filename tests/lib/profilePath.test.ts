import { describe, it, expect } from "vitest";
import type { Horse } from "@/lib/horses";
import { horses as seedHorses } from "@/lib/horses";
import {
  profilePathFor,
  profileUrlFor,
  deriveProfileIdentifier,
} from "@/lib/profilePath";
import { stableIdForName } from "@/lib/profileIds";

describe("profilePath helpers", () => {
  it("derives canonical path for a seed horse", () => {
    const seed = seedHorses.find((horse) => horse.name === "Marlin");
    if (!seed) throw new Error("Seed horse Marlin must be defined for the test.");
    const path = profilePathFor(seed);
    expect(path).toBe(`/profiles/${stableIdForName(seed.name)}`);
  });

  it("derives canonical path for a database horse", () => {
    const dbHorse: Horse = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Comet",
      age: 9,
      breed: "Dutch Warmblood",
      location: "Amsterdam, NL",
      gender: "Gelding",
      heightCm: 165,
      color: "Bay",
      temperament: "Curious",
      disciplines: ["dressage"],
      interests: ["hacking"],
      description: "Elegant database horse.",
      image: "/TFH/Tinder-for-Horses-cover-image.png",
    };
    const path = profilePathFor(dbHorse);
    expect(path).toBe(`/profiles/${dbHorse.id}`);
  });

  it("prefers external identifier when provided", () => {
    const horse = seedHorses[0];
    const identifier = deriveProfileIdentifier(horse);
    if (!identifier) throw new Error("Identifier should be derived for seed horse.");
    const path = profilePathFor(undefined, identifier);
    expect(path).toBe(`/profiles/${identifier.id}`);
  });

  it("builds absolute URLs with profileUrlFor", () => {
    const sample = seedHorses[1];
    const url = profileUrlFor("https://secondhorse.test", sample);
    expect(url).toMatch(/^https:\/\/secondhorse\.test\/profiles\//);
  });
});
