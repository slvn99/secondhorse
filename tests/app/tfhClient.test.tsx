
import React from "react";
import { describe, it, beforeEach, afterEach, expect } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import TfhClient from "@/app/_components/TfhClient";
import type { Horse } from "@/lib/horses";
import { renderElement } from "../setup";
import { stableIdForName } from "@/lib/profileIds";

const seedHorse: Horse = {
  name: "Seed Hero",
  age: 7,
  breed: "Arabian",
  location: "Pasture",
  gender: "Mare",
  heightCm: 152,
  color: "Bay",
  temperament: "Friendly",
  disciplines: ["Trail"],
  interests: ["Grazing"],
  description: "Always ready for adventure.",
  image: "/TFH/Tinder-for-Horses-cover-image.png",
  photos: ["/TFH/Tinder-for-Horses-cover-image.png"],
};

const dbHorse: Horse = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  name: "Database Champ",
  age: 9,
  breed: "Warmblood",
  location: "Stables",
  gender: "Gelding",
  heightCm: 165,
  color: "Gray",
  temperament: "Calm",
  disciplines: ["Jumping"],
  interests: ["Carrots"],
  description: "Reliable competition partner.",
  image: "/TFH/Tinder-for-Horses-cover-image.png",
  photos: ["/TFH/Tinder-for-Horses-cover-image.png"],
};

beforeEach(() => {
  // Ensure a consistent origin for history updates.
  (globalThis as any).jsdom?.reconfigure({ url: "http://localhost/" });
  window.history.replaceState({}, "", "http://localhost/");
});

afterEach(() => {
  window.history.replaceState({}, "", "http://localhost/");
});

describe("TfhClient profile deep links", () => {
  it("opens modal for seeded profile via profile query", async () => {
    const key = `seed:${stableIdForName(seedHorse.name).toLowerCase()}`;
    const url = new URL(window.location.href);
    url.search = `?profile=${encodeURIComponent(key)}`;
    window.history.replaceState({}, "", url.toString());
    const { unmount } = renderElement(<TfhClient horses={[seedHorse, dbHorse]} />);

    const modal = await screen.findByTestId("profile-modal");
    const modalQueries = within(modal);
    expect(modalQueries.getByText(`${seedHorse.name}, ${seedHorse.age}`)).toBeTruthy();
    unmount();
  });

  it("opens modal for database profile via profile query and clears on close", async () => {
    const key = `db:${dbHorse.id!.toLowerCase()}`;
    const url = new URL(window.location.href);
    url.search = `?profile=${encodeURIComponent(key)}`;
    window.history.replaceState({}, "", url.toString());
    const { unmount } = renderElement(<TfhClient horses={[seedHorse, dbHorse]} />);

    const modal = await screen.findByTestId("profile-modal");
    const modalQueries = within(modal);
    expect(modalQueries.getByText(`${dbHorse.name}, ${dbHorse.age}`)).toBeTruthy();

    modalQueries.getByRole("button", { name: /close/i }).click();
    await waitFor(() => expect(screen.queryByTestId("profile-modal")).toBeNull());
    expect(new URL(window.location.href).searchParams.get("profile")).toBeNull();
    unmount();
  });
});

