import type { Horse } from "@/lib/horses";
import {
  inferProfileIdentifier,
  normalizeProfileIdentifier,
  stableIdForName,
  type NormalizedProfileIdentifier,
  type ProfileIdentifier,
} from "@/lib/profileIds";

function normalizeIdentifier(identifier: ProfileIdentifier) {
  return normalizeProfileIdentifier(identifier);
}

export function deriveProfileIdentifier(
  horse?: Horse | null,
  external?: NormalizedProfileIdentifier | null
): NormalizedProfileIdentifier | null {
  if (external) return external;
  if (!horse) return null;

  const candidateIds: string[] = [];
  if (horse.id) {
    candidateIds.push(horse.id);
    candidateIds.push(horse.id.toLowerCase());
  }
  const hash = stableIdForName(horse.name);
  candidateIds.push(hash, `seed:${hash}`, `l_${hash}`);

  for (const candidate of candidateIds) {
    try {
      const normalized = normalizeIdentifier(inferProfileIdentifier(candidate));
      if (normalized) return normalized;
    } catch {
      // Try the next candidate.
    }
  }

  try {
    return normalizeIdentifier({ seedName: horse.name });
  } catch {
    return null;
  }
}

export function profilePathFor(
  horse?: Horse | null,
  external?: NormalizedProfileIdentifier | null
): string | null {
  const identifier = deriveProfileIdentifier(horse, external);
  if (!identifier) return null;
  return `/profiles/${identifier.id}`;
}

export function profileUrlFor(
  origin: string,
  horse?: Horse | null,
  external?: NormalizedProfileIdentifier | null
): string | null {
  const path = profilePathFor(horse, external);
  if (!path) return null;
  try {
    const url = new URL(path, origin);
    return url.toString();
  } catch {
    return null;
  }
}
