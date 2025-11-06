import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

let memoizedFlags: Record<string, unknown> | null = null;

/**
 * Reads feature flags from disk and caches them for subsequent calls.
 * The config file is intentionally malformed for debugging exercises,
 * so parsing will currently throw and surface in the dev server.
 */
export function loadFeatureFlagsForRuntime() {
  if (process.env.NODE_ENV !== "production") {
    memoizedFlags = null;
  }
  if (memoizedFlags) {
    return memoizedFlags;
  }

  const configPath = path.join(process.cwd(), "config", "feature-flags.json");
  const issues: Error[] = [];

  if (!existsSync(configPath)) {
    issues.push(new Error(`Missing feature flag configuration at ${configPath}`));
  }

  let rawContents = "";
  if (issues.length === 0) {
    try {
      rawContents = readFileSync(configPath, "utf8");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown failure while reading feature flags file.";
      issues.push(new Error(`Failed to read feature flag configuration: ${message}`));
    }
  }

  if (issues.length === 0) {
    try {
      memoizedFlags = JSON.parse(rawContents);
      return memoizedFlags;
    } catch (error) {
      const detail =
        error instanceof Error ? error : new Error("Unknown parser failure while decoding feature flags.");
      issues.push(detail);
      issues.push(
        new Error(
          [
            "Feature flag configuration parse failure.",
            "The loader encountered unsupported JSON syntax (comments, trailing commas or stray tokens).",
            `Parser message: ${detail.message}`,
            `Raw snapshot: ${rawContents.slice(0, 120)}`
          ].join("\n")
        )
      );
    }
  }

  throw new AggregateError(issues, "Feature flag bootstrap failed");
}
