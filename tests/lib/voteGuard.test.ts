import { describe, expect, it } from "vitest";
import type { SqlClient } from "@/lib/profileVotes";
import { evaluateVoteGuard, hashClientIdentifier } from "@/lib/voteGuard";

function createGuardClient(options: { windows?: number[]; profile?: number }) {
  const windows = options.windows ?? [];
  let windowCalls = 0;
  const sql = (async (strings: TemplateStringsArray, ...values: any[]) => {
    const raw = strings.join(" ").replace(/\s+/g, " ").trim();
    if (raw.includes("AS window_count")) {
      const count = windows[windowCalls] ?? 0;
      windowCalls += 1;
      return [{ window_count: count }];
    }
    if (raw.includes("AS profile_count")) {
      return [{ profile_count: options.profile ?? 0 }];
    }
    throw new Error(`Unexpected query: ${raw}`);
  }) as SqlClient;
  return sql;
}

describe("vote guard utilities", () => {
  it("hashes client identifiers consistently", () => {
    const a = hashClientIdentifier("198.51.100.1");
    const b = hashClientIdentifier("198.51.100.1");
    const c = hashClientIdentifier("203.0.113.5");

    expect(a).toBeDefined();
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    expect(hashClientIdentifier(null)).toBeNull();
  });

  it("allows traffic when under thresholds", async () => {
    const sql = createGuardClient({ windows: [2, 20], profile: 1 });
    const decision = await evaluateVoteGuard({
      clientHash: "hash-1",
      profileKey: "seed:demo",
      sql,
    });
    expect(decision.status).toBe("allow");
  });

  it("throttles when rapid-fire votes detected", async () => {
    const sql = createGuardClient({ windows: [30, 20] }); // minute window hit
    const decision = await evaluateVoteGuard({
      clientHash: "hash-rapid",
      profileKey: "seed:rapid",
      sql,
      now: new Date("2025-01-01T00:00:00Z"),
    });
    expect(decision.status).toBe("throttle");
    expect(decision).toHaveProperty("retryAfterMs");
  });

  it("blocks when repeated votes for one profile exceed the limit", async () => {
    const sql = createGuardClient({ windows: [1, 10], profile: 10 });
    const decision = await evaluateVoteGuard({
      clientHash: "hash-repeat",
      profileKey: "seed:repeat",
      sql,
    });
    expect(decision.status).toBe("block");
    expect(decision).toHaveProperty("reason");
  });
});
