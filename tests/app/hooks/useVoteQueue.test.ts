import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useVoteQueue } from "@/app/_hooks/useVoteQueue";
import type { Horse } from "@/lib/horses";
import { stableIdForName } from "@/lib/profileIds";

function createHorse(overrides: Partial<Horse> = {}): Horse {
  return {
    name: "Star",
    age: 5,
    breed: "Arabian",
    location: "Test Ranch",
    gender: "Mare",
    heightCm: 150,
    color: "Chestnut",
    temperament: "Friendly",
    disciplines: [],
    interests: [],
    description: "A friendly test horse.",
    image: "/TFH/test.png",
    ...overrides,
  };
}

const okResponse = {
  ok: true,
  status: 200,
  json: vi.fn().mockResolvedValue({}),
} as unknown as Response;

describe("useVoteQueue", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (globalThis as any).fetch;
  });

  it("submits a vote for a database profile", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse);
    (globalThis as any).fetch = fetchMock;

    const { result } = renderHook(() => useVoteQueue());

    await act(async () => {
      await result.current.queueVote(
        createHorse({ id: "123e4567-e89b-12d3-a456-426614174000" }),
        true
      );
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/profiles/123e4567-e89b-12d3-a456-426614174000/vote");
    expect(JSON.parse(String((init as RequestInit).body))).toEqual({
      direction: "like",
      profileType: "db",
    });
  });

  it("retries after a transient failure and eventually succeeds", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("network glitch"))
      .mockResolvedValue(okResponse);
    (globalThis as any).fetch = fetchMock;

    const { result } = renderHook(() => useVoteQueue());

    await act(async () => {
      const promise = result.current.queueVote(createHorse(), false);
      await vi.runAllTimersAsync();
      await promise;
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, secondInit] = fetchMock.mock.calls[1];
    expect(JSON.parse(String((secondInit as RequestInit).body))).toEqual({
      direction: "dislike",
      profileType: "seed",
      seedName: "Star",
    });
  });

  it("exposes an error after exhausting retries", async () => {
    vi.useFakeTimers();
    const failureResponse = {
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({ error: { message: "Server down" } }),
    } as unknown as Response;
    const fetchMock = vi.fn().mockResolvedValue(failureResponse);
    (globalThis as any).fetch = fetchMock;

    const { result } = renderHook(() => useVoteQueue());

    let capturedError: unknown;
    await act(async () => {
      const promise = result.current
        .queueVote(createHorse({ id: `l_${stableIdForName("Star")}` }), true)
        .catch((err) => {
          capturedError = err;
        });
      await vi.runAllTimersAsync();
      await promise;
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(capturedError).toBeInstanceOf(Error);
    expect(result.current.lastError).toContain("Server down");

    act(() => {
      result.current.clearError();
    });
    expect(result.current.lastError).toBeNull();
  });
});
