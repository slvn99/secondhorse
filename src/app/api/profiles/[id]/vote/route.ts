import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/app/_lib/rateLimit";
import { recordFlaggedVoteAttempt, recordProfileVote } from "@/lib/profileVotes";
import {
  inferProfileIdentifier,
  normalizeProfileIdentifier,
  type ProfileSource,
} from "@/lib/profileIds";
import { serializeVoteTotals, type VoteRequestPayload } from "@/lib/voteTypes";
import { evaluateVoteGuard, hashClientIdentifier } from "@/lib/voteGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const voteRequestSchema = z.object({
  direction: z.enum(["like", "dislike"]),
  profileType: z.enum(["db", "seed"]).optional(),
  seedName: z
    .string()
    .trim()
    .min(1, "seedName cannot be empty")
    .max(160, "seedName is too long")
    .optional(),
}) satisfies z.ZodType<VoteRequestPayload>;

function problemJson(status: number, message: string, details?: Record<string, unknown>) {
  return NextResponse.json(
    { error: { message, ...(details ?? {}) } },
    { status }
  );
}

function clientAddress(request: NextRequest | Request): string {
  if ("headers" in request) {
    const primary =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      request.headers.get("fly-client-ip") ||
      request.headers.get("cf-connecting-ip");
    if (primary) {
      const value = primary.split(",")[0]?.trim();
      if (value) return value;
    }
    const address = request.headers.get("remote-addr");
    if (address) return address;
  }
  return "unknown";
}

export async function POST(request: Request, context: any) {
  const params = await Promise.resolve(context?.params);
  const rawId = params?.id;
  if (!rawId) {
    return problemJson(404, "Profile not found");
  }

  let payload: VoteRequestPayload;
  try {
    const json = await request.json();
    payload = voteRequestSchema.parse(json);
  } catch (error) {
    console.error("Vote payload parsing failed", error);
    if (error instanceof z.ZodError) {
      return problemJson(400, "Invalid vote payload", {
        issues: error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      });
    }
    return problemJson(400, "Request body must be valid JSON");
  }

  let identifierSource: ProfileSource | undefined = payload.profileType;
  try {
    const identifier = inferProfileIdentifier(rawId, {
      type: payload.profileType,
      seedName: payload.seedName,
    });
    const normalized = normalizeProfileIdentifier(identifier);
    const clientId = clientAddress(request);
    const clientHash = hashClientIdentifier(clientId);

    identifierSource = normalized.source;

    const key = `vote:${normalized.key}:${clientId}`;
    const limiter = rateLimit(key, 5, 60_000);
    if (!limiter.allowed) {
      return problemJson(429, "Too many votes for this profile from your connection");
    }

    const now = new Date();
    const guardDecision = await evaluateVoteGuard({
      clientHash,
      profileKey: normalized.key,
    });
    if (guardDecision.status !== "allow") {
      await recordFlaggedVoteAttempt({
        profile: identifier,
        direction: payload.direction,
        clientHash,
        reason: guardDecision.reason,
        timestamp: now,
      });
      return problemJson(429, guardDecision.reason, {
        retryAfterMs: guardDecision.retryAfterMs,
      });
    }

    const totals = await recordProfileVote({
      profile: identifier,
      direction: payload.direction,
      clientHash,
      timestamp: now,
    });

    return NextResponse.json({
      totals: serializeVoteTotals(totals),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return problemJson(400, "Invalid vote payload", {
        issues: error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      });
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error("Vote persistence error", error);
    if (message.includes("DATABASE_URL")) {
      return problemJson(503, "Vote persistence is not configured");
    }
    if (message.includes("profile id must") || message.includes("seedName")) {
      return problemJson(400, "Invalid profile identifier", { source: identifierSource });
    }
    return problemJson(500, "Failed to record vote", { message });
  }
}
