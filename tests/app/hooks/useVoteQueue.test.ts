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
    delete (globalThis as any).fetch;
  });

  it("queues a database vote without surfacing errors", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse);
    (globalThis as any).fetch = fetchMock;

    const { result } = renderHook(() => useVoteQueue());

    let votePromise: Promise<void> | undefined;
    await act(async () => {
      votePromise = result.current.queueVote(
        createHorse({ id: "123e4567-e89b-12d3-a456-426614174000" }),
        true
      );
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/profiles/123e4567-e89b-12d3-a456-426614174000/vote");
    expect(JSON.parse(String((init as RequestInit).body))).toEqual({
      direction: "like",
      profileType: "db",
    });
    expect(votePromise).toBeDefined();
    await act(async () => {
      await votePromise!;
    });
    expect(result.current.pendingCount).toBe(0);
    expect(result.current.lastError).toBeNull();
  });

  it("retries retryable failures with backoff before succeeding", async () => {
    vi.useFakeTimers();
    const timeoutSpy = vi.spyOn(globalThis, "setTimeout");
    const failureResponse = {
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({ error: { message: "Server down" } }),
    } as unknown as Response;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(failureResponse)
      .mockResolvedValueOnce(failureResponse)
      .mockResolvedValue(okResponse);
    (globalThis as any).fetch = fetchMock;

    const { result } = renderHook(() => useVoteQueue());

    let votePromise: Promise<void> | undefined;
    await act(async () => {
      votePromise = result.current.queueVote(
        createHorse({ id: `l_${stableIdForName("Star")}` }),
        true
      );
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600);
    });
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(3);

    expect(votePromise).toBeDefined();
    await act(async () => {
      await votePromise!;
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const backoffDelays = timeoutSpy.mock.calls
      .map(([, delay]) => (typeof delay === "number" ? delay : null))
      .filter((delay): delay is number => delay !== null);
    expect(backoffDelays.slice(-2)).toEqual([800, 1600]);
    const thirdCall = fetchMock.mock.calls[2];
    const thirdInit = thirdCall?.[1] as RequestInit | undefined;
    expect(thirdInit).toBeDefined();
    expect(JSON.parse(String(thirdInit?.body))).toMatchObject({
      direction: "like",
      profileType: "seed",
      seedName: "Star",
    });
    expect(result.current.pendingCount).toBe(0);
    expect(result.current.lastError).toBeNull();
  });

  it("surfaces non-retryable failures and clears errors on request", async () => {
    const throttledResponse = {
      ok: false,
      status: 429,
      json: vi.fn().mockResolvedValue({}),
    } as unknown as Response;
    const fetchMock = vi.fn().mockResolvedValue(throttledResponse);
    (globalThis as any).fetch = fetchMock;

    const { result } = renderHook(() => useVoteQueue());

    let captured: Error | null = null;
    await act(async () => {
      try {
        await result.current.queueVote(createHorse(), false);
      } catch (error) {
        captured = error as Error;
      }
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(captured).toBeInstanceOf(Error);
    expect(captured?.message).toBe("You are voting too quickly. Please slow down.");
    expect(result.current.pendingCount).toBe(0);
    expect(result.current.lastError).toBe("You are voting too quickly. Please slow down.");

    act(() => {
      result.current.clearError();
    });

    expect(result.current.lastError).toBeNull();
  });
});
