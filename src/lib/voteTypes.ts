import type { VoteDirection, ProfileVoteTotals } from "@/lib/profileVotes";
import type { ProfileSource } from "@/lib/profileIds";

export type VoteRequestPayload = {
  direction: VoteDirection;
  profileType?: ProfileSource;
  seedName?: string;
};

export type VoteApiResponse = {
  profileKey: string;
  source: ProfileSource;
  id: string;
  likes: number;
  dislikes: number;
  profileAgeDays: number;
  profileCreatedAt: string | null;
  firstVoteAt: string | null;
  lastVoteAt: string | null;
  updatedAt: string | null;
};

export type LeaderboardSummary = {
  totalProfiles: number;
  totalLikes: number;
  totalDislikes: number;
  generatedAt: string;
};

export type LeaderboardEntry = VoteApiResponse & {
  rank: number;
  directionCount: number;
  displayName: string;
  imageUrl: string | null;
};

export type LeaderboardResponse = {
  summary: LeaderboardSummary;
  likes: LeaderboardEntry[];
  dislikes: LeaderboardEntry[];
};

export function serializeVoteTotals(totals: ProfileVoteTotals): VoteApiResponse {
  return {
    profileKey: totals.profileKey,
    source: totals.source,
    id: totals.id,
    likes: totals.likes,
    dislikes: totals.dislikes,
    profileAgeDays: totals.profileAgeDays,
    profileCreatedAt: totals.profileCreatedAt?.toISOString() ?? null,
    firstVoteAt: totals.firstVoteAt?.toISOString() ?? null,
    lastVoteAt: totals.lastVoteAt?.toISOString() ?? null,
    updatedAt: totals.updatedAt?.toISOString() ?? null,
  };
}
