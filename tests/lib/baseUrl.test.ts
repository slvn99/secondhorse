import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const originalEnv = { ...process.env };

async function loadResolver() {
  vi.resetModules();
  return (await import("@/app/_lib/baseUrl")).resolveBaseUrl;
}

beforeEach(() => {
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("resolveBaseUrl", () => {
  it("preserves explicit http scheme from NEXT_PUBLIC_SITE_URL", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000/";

    const resolveBaseUrl = await loadResolver();
    expect(resolveBaseUrl()).toBe("http://localhost:3000");
  });

  it("trims whitespace and trailing slashes for https values", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "  https://example.org///  ";

    const resolveBaseUrl = await loadResolver();
    expect(resolveBaseUrl()).toBe("https://example.org");
  });

  it("prefers production url when env overrides are unset", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "my-app.vercel.app";
    process.env.VERCEL_BRANCH_URL = "feature.vercel.app";
    process.env.VERCEL_URL = "deploy.vercel.app";

    const resolveBaseUrl = await loadResolver();
    expect(resolveBaseUrl()).toBe("https://my-app.vercel.app");
  });

  it("falls back to provided default domain with https scheme", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL_BRANCH_URL;
    delete process.env.VERCEL_URL;

    const resolveBaseUrl = await loadResolver();
    expect(resolveBaseUrl("custom.example")).toBe("https://custom.example");
  });
});
