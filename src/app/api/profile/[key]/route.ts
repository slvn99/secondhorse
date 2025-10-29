import { NextResponse } from "next/server";
import { parseProfileKey, stableIdForName } from "@/lib/profileIds";
import { horses } from "@/lib/horses";
import { loadHorseFromDbById } from "@/lib/horseSource";
import type { Horse } from "@/lib/horses";

function findSeedHorse(id: string): Horse | null {
  const normalized = id.toLowerCase();
  const match = horses.find((horse) => {
    const seedId = stableIdForName(horse.name).toLowerCase();
    const possibleIds = [seedId, `l_${seedId}`];
    const horseId = horse.id?.toLowerCase();
    return possibleIds.includes(normalized) || horseId === normalized;
  });
  if (!match) return null;
  return {
    ...match,
    id: match.id ?? `seed:${stableIdForName(match.name).toLowerCase()}`,
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ key?: string }> }
) {
  const { key: rawKey } = await context.params;
  if (!rawKey) {
    return NextResponse.json({ error: "Profile key is required" }, { status: 400 });
  }

  try {
    const decoded = decodeURIComponent(rawKey);
    const normalized = parseProfileKey(decoded);
    if (normalized.source === "seed") {
      const horse = findSeedHorse(normalized.id);
      if (!horse) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }
      return NextResponse.json({ horse, source: normalized.source } as const);
    }

    const horse = await loadHorseFromDbById(normalized.id);
    if (!horse) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    return NextResponse.json({ horse, source: normalized.source } as const);
  } catch (error) {
    console.error("Failed to load profile", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}
