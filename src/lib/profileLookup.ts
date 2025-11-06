import type { Horse } from "@/lib/horses";
import { horses as seedHorses } from "@/lib/horses";
import {
  inferProfileIdentifier,
  normalizeProfileIdentifier,
  parseProfileKey,
  stableIdForName,
  type NormalizedProfileIdentifier,
  type ProfileIdentifier,
} from "@/lib/profileIds";
import { loadHorseFromDbById } from "@/lib/horseSource";

export type ProfileLookupResult = {
  horse: Horse | null;
  identifier: NormalizedProfileIdentifier | null;
};

function normalizeSeedHorse(seedHorse: Horse): Horse {
  const derivedId = stableIdForName(seedHorse.name).toLowerCase();
  const existing = seedHorse.id?.trim().toLowerCase();
  const seedId =
    existing && (existing.startsWith("seed:") || existing.startsWith("db:"))
      ? existing
      : `seed:${derivedId}`;

  return {
    ...seedHorse,
    id: seedId,
    image: seedHorse.image,
  };
}

export function findSeedHorseByIdentifier(id: string): Horse | null {
  const normalized = id.trim().toLowerCase();
  if (!normalized) return null;

  for (const horse of seedHorses) {
    const hash = stableIdForName(horse.name).toLowerCase();
    const candidates = new Set<string>([
      hash,
      `seed:${hash}`,
      `l_${hash}`,
      horse.id?.toLowerCase() ?? "",
    ]);
    if (horse.id?.startsWith("seed:")) {
      candidates.add(horse.id.toLowerCase());
    }
    if (horse.id?.startsWith("l_")) {
      candidates.add(horse.id.slice(2).toLowerCase());
    }
    if (candidates.has(normalized)) {
      return normalizeSeedHorse(horse);
    }
  }
  return null;
}

function normalizeProfileIdentifierFrom(
  identifier: ProfileIdentifier
): NormalizedProfileIdentifier {
  return normalizeProfileIdentifier(identifier);
}

export function resolveProfileIdentifier(
  raw: string | null | undefined
): NormalizedProfileIdentifier | null {
  if (!raw) return null;
  const decoded = (() => {
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  })();
  const trimmed = decoded.trim();
  if (!trimmed) return null;

  const attempts = [trimmed, trimmed.toLowerCase()];

  for (const attempt of attempts) {
    try {
      return parseProfileKey(attempt);
    } catch {
      // ignore - we will try other strategies
    }
  }

  const withoutLocalPrefix = attempts
    .map((attempt) => (attempt.startsWith("l_") ? attempt.slice(2) : attempt))
    .concat(trimmed);

  for (const candidate of withoutLocalPrefix) {
    const seedByName = seedHorses.find(
      (horse) => horse.name.trim().toLowerCase() === candidate.toLowerCase()
    );
    if (seedByName) {
      return normalizeProfileIdentifierFrom({ seedName: seedByName.name });
    }

    try {
      return normalizeProfileIdentifierFrom(
        inferProfileIdentifier(candidate, {})
      );
    } catch {
      // continue trying
    }
  }

  return null;
}

export async function loadHorseForProfileKey(
  raw: string | null | undefined
): Promise<ProfileLookupResult> {
  const identifier = resolveProfileIdentifier(raw);
  if (!identifier) {
    return { horse: null, identifier: null };
  }

  if (identifier.source === "seed") {
    const horse = findSeedHorseByIdentifier(identifier.id);
    return { horse, identifier };
  }

  const horse = await loadHorseFromDbById(identifier.id);
  return { horse, identifier };
}

export function listSeedProfileParams(): NormalizedProfileIdentifier[] {
  const seen = new Set<string>();
  const params: NormalizedProfileIdentifier[] = [];

  for (const horse of seedHorses) {
    try {
      const normalized = normalizeProfileIdentifierFrom({
        seedName: horse.name,
      });
      if (!seen.has(normalized.key)) {
        seen.add(normalized.key);
        params.push(normalized);
      }
    } catch {
      // ignore malformed seed horses
    }
  }

  return params;
}

export function isSeedProfile(identifier: NormalizedProfileIdentifier | null) {
  return identifier?.source === "seed";
}
