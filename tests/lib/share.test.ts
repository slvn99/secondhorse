import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { shareWithNativeOrCopy, PROFILE_SHARE_TEXT } from "@/lib/share";

describe("shareWithNativeOrCopy", () => {
  const originalNavigator = globalThis.navigator;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: originalNavigator,
      writable: false,
    });
  });

  function mockNavigator(stub: Partial<Navigator>) {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {
        ...stub,
      } as Navigator,
      writable: false,
    });
  }

  it("returns shared when native share succeeds", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    mockNavigator({
      share,
      canShare: vi.fn().mockReturnValue(true) as any,
      clipboard: { writeText: vi.fn() } as any,
    });

    const result = await shareWithNativeOrCopy({
      title: "Second Horse",
      text: PROFILE_SHARE_TEXT,
      url: "https://example.com",
    });

    expect(result).toBe("shared");
    expect(share).toHaveBeenCalledWith({
      title: "Second Horse",
      text: PROFILE_SHARE_TEXT,
      url: "https://example.com",
    });
  });

  it("returns cancelled when native share is dismissed by the user", async () => {
    const shareError = Object.assign(new Error("cancelled"), { name: "AbortError" });
    const share = vi.fn().mockRejectedValue(shareError);
    const writeText = vi.fn();

    mockNavigator({
      share,
      canShare: vi.fn().mockReturnValue(true) as any,
      clipboard: { writeText } as any,
    });

    const result = await shareWithNativeOrCopy({
      title: "Second Horse",
      text: PROFILE_SHARE_TEXT,
      url: "https://example.com",
    });

    expect(result).toBe("cancelled");
    expect(writeText).not.toHaveBeenCalled();
  });

  it("falls back to clipboard when native share is unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockNavigator({
      clipboard: { writeText } as any,
    });

    const result = await shareWithNativeOrCopy({
      title: "Second Horse",
      text: PROFILE_SHARE_TEXT,
      url: "https://example.com",
    });

    expect(result).toBe("copied");
    expect(writeText).toHaveBeenCalledWith(`${
      PROFILE_SHARE_TEXT
    }\nhttps://example.com`);
  });

  it("returns failed when neither share nor clipboard succeed", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("no clipboard"));
    mockNavigator({
      clipboard: { writeText } as any,
    });

    const result = await shareWithNativeOrCopy({
      title: "Second Horse",
      text: PROFILE_SHARE_TEXT,
      url: "https://example.com",
    });

    expect(result).toBe("failed");
  });
});
