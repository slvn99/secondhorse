"use client";

import { useCallback, useRef, useState } from "react";
import type { Horse } from "@/lib/horses";
import { inferProfileIdentifier, stableIdForName, type ProfileSource } from "@/lib/profileIds";

type VoteDirection = "like" | "dislike";

type VoteTarget = {
  id: string;
  profileType: ProfileSource;
  seedName?: string;
};

const MAX_ATTEMPTS = 3;
const RETRY_BASE_MS = 800;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function deriveVoteTarget(horse: Horse): VoteTarget {
  const name = horse.name;
  const rawId = typeof horse.id === "string" ? horse.id.trim() : "";
  const fallbackSeedId = stableIdForName(name);

  if (!rawId) {
    return { id: fallbackSeedId, profileType: "seed", seedName: name };
  }

  if (rawId.startsWith("l_")) {
    const seedId = rawId.slice(2) || fallbackSeedId;
    return { id: seedId, profileType: "seed", seedName: name };
  }

  try {
    const inferred = inferProfileIdentifier(rawId);
    if ("dbId" in inferred) {
      return { id: inferred.dbId, profileType: "db" };
    }
    if ("seedId" in inferred) {
      return { id: inferred.seedId, profileType: "seed", seedName: name };
    }
  } catch {
    // fall back to seeded identifier below
  }

  return { id: fallbackSeedId, profileType: "seed", seedName: name };
}

async function executeVoteRequest(target: VoteTarget, direction: VoteDirection) {
  const url = `/api/profiles/${encodeURIComponent(target.id)}/vote`;
  const payload: Record<string, unknown> = {
    direction,
  };
  if (target.profileType === "seed") {
    payload.profileType = "seed";
    if (target.seedName) payload.seedName = target.seedName;
  } else {
    payload.profileType = "db";
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "same-origin",
  });

  if (response.ok) {
    return;
  }

  let errorMessage: string | null = null;
  try {
    const data = await response.json();
    if (data && typeof data === "object" && "error" in data) {
      const err = (data as any).error;
      if (err && typeof err.message === "string") {
        errorMessage = err.message;
      }
    }
  } catch {
    // ignore parse errors
  }

  const message =
    errorMessage ??
    (response.status === 429
      ? "You are voting too quickly. Please slow down."
      : `Vote request failed (${response.status})`);

  const shouldRetry = response.status >= 500;
  throw Object.assign(new Error(message), { retryable: shouldRetry });
}

type QueueResult = {
  queueVote: (horse: Horse, liked: boolean) => Promise<void>;
  pendingCount: number;
  lastError: string | null;
  clearError: () => void;
};

export function useVoteQueue(): QueueResult {
  const [pendingCount, setPendingCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const chainRef = useRef<Promise<void>>(Promise.resolve());

  const queueVote = useCallback(
    (horse: Horse, liked: boolean) => {
      const target = deriveVoteTarget(horse);
      const direction: VoteDirection = liked ? "like" : "dislike";
      setPendingCount((count) => count + 1);

      const job = async () => {
        let attempt = 0;
        while (attempt < MAX_ATTEMPTS) {
          attempt += 1;
          try {
            await executeVoteRequest(target, direction);
            return;
          } catch (error) {
            const err = error as Error & { retryable?: boolean };
            const retryable =
              err?.retryable === true ||
              (!("retryable" in err) && attempt < MAX_ATTEMPTS && err.message.includes("network"));
            if (attempt >= MAX_ATTEMPTS || !retryable) {
              throw err;
            }
            const waitMs = RETRY_BASE_MS * attempt;
            await delay(waitMs);
          }
        }
      };

      const run = chainRef.current
        .catch(() => {
          // Ensure previous rejection does not block queue execution.
        })
        .then(job);

      chainRef.current = run.catch(() => {});

      return run
        .catch((error) => {
          const message = error instanceof Error ? error.message : "Unable to record vote.";
          setLastError(message);
          throw error;
        })
        .finally(() => {
          setPendingCount((count) => Math.max(0, count - 1));
        });
    },
    []
  );

  const clearError = useCallback(() => setLastError(null), []);

  return { queueVote, pendingCount, lastError, clearError };
}
