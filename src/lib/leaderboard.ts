import { cacheLife, cacheTag } from "next/cache";
import { neon } from "@neondatabase/serverless";
import { horses } from "@/lib/horses";
import { stableIdForName } from "@/lib/profileIds";
import {
  listTopProfileVoteTotals,
  fetchVoteSummary,
  type SqlClient,
  type ProfileVoteTotals,
} from "@/lib/profileVotes";
import {
  serializeVoteTotals,
  type LeaderboardResponse,
  type LeaderboardEntry,
} from "@/lib/voteTypes";

type ProfileMetadata = {
  displayName: string;
  imageUrl: string | null;
};

type GenerateOptions = {
  limit?: number;
  sql?: SqlClient;
  databaseUrl?: string;
};

type ProfileMetadataRow = {
  id: string;
  display_name: string | null;
  image_url: string | null;
};

async function fetchDbMetadata(sql: SqlClient | undefined, ids: string[]): Promise<Map<string, ProfileMetadata>> {
  const map = new Map<string, ProfileMetadata>();
  if (!sql || ids.length === 0) return map;

  const rows = await sql<ProfileMetadataRow>`
    SELECT
      p.id,
      p.display_name,
      photo.image_url
    FROM profiles p
    LEFT JOIN LATERAL (
      SELECT url AS image_url
      FROM profile_photos ph
      WHERE ph.profile_id = p.id
      ORDER BY ph.is_primary DESC, ph.position ASC
      LIMIT 1
    ) AS photo ON true
    WHERE p.id = ANY(${ids});
  `;

  for (const record of rows) {
    const displayName = record.display_name?.trim() || "Unknown profile";
    map.set(record.id, {
      displayName,
      imageUrl: record.image_url,
    });
  }

  return map;
}

const seedMetadataCache = (() => {
  const map = new Map<string, ProfileMetadata>();
  for (const horse of horses) {
    try {
      const id = stableIdForName(horse.name);
      map.set(id, {
        displayName: horse.name,
        imageUrl: horse.image ?? null,
      });
    } catch {
      // Ignore malformed entries
    }
  }
  return map;
})();

function toLeaderboardEntries(
  totals: ProfileVoteTotals[],
  metadata: Map<string, ProfileMetadata>,
  direction: "likes" | "dislikes"
): LeaderboardEntry[] {
  return totals.map((item, index) => {
    const seedMeta = seedMetadataCache.get(item.id);
    const meta =
      item.source === "db"
        ? metadata.get(item.id) || { displayName: `Profile ${item.id.slice(0, 6)}`, imageUrl: null }
        : seedMeta || { displayName: "Seeded profile", imageUrl: null };
    const base = serializeVoteTotals(item);
    return {
      ...base,
      rank: index + 1,
      directionCount: direction === "likes" ? item.likes : item.dislikes,
      displayName: meta.displayName,
      imageUrl: meta.imageUrl,
    };
  });
}

export async function generateLeaderboard(options: GenerateOptions = {}): Promise<LeaderboardResponse> {
  "use cache";
  cacheLife("leaderboard");
  cacheTag("leaderboard");
  const { limit = 25, sql, databaseUrl } = options;
  const client = sql ?? (databaseUrl ? (neon(databaseUrl) as unknown as SqlClient) : undefined);

  const [likes, dislikes, summary] = await Promise.all([
    listTopProfileVoteTotals({ order: "likes", limit, sql: client, databaseUrl }),
    listTopProfileVoteTotals({ order: "dislikes", limit, sql: client, databaseUrl }),
    fetchVoteSummary({ sql: client, databaseUrl }),
  ]);

  const dbIds = Array.from(
    new Set(
      [...likes, ...dislikes]
        .filter((item) => item.source === "db")
        .map((item) => item.id)
    )
  );
  const metadata = await fetchDbMetadata(client, dbIds);

  return {
    summary: {
      totalProfiles: summary.totalProfiles,
      totalLikes: summary.totalLikes,
      totalDislikes: summary.totalDislikes,
      generatedAt: new Date().toISOString(),
    },
    likes: toLeaderboardEntries(likes, metadata, "likes"),
    dislikes: toLeaderboardEntries(dislikes, metadata, "dislikes"),
  };
}
