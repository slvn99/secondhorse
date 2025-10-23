import type { Metadata } from "next";
import LeaderboardClient from "./LeaderboardClient";
import { generateLeaderboard } from "@/lib/leaderboard";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "See the most liked and disliked horse profiles across Second Horse Dating.",
};

export const revalidate = 60;

export default async function LeaderboardPage() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-neutral-300">
        <h1 className="text-3xl font-semibold text-white">Leaderboard unavailable</h1>
        <p className="mt-4 text-sm">
          A database connection is required to display community stats. Configure <code className="font-mono">DATABASE_URL</code> and try again.
        </p>
      </div>
    );
  }

  try {
    const data = await generateLeaderboard({ databaseUrl });
    return <LeaderboardClient data={data} />;
  } catch (error) {
    console.warn("Failed to render leaderboard page:", error);
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-neutral-300">
        <h1 className="text-3xl font-semibold text-white">Something went wrong</h1>
        <p className="mt-4 text-sm">We couldn&#39;t load the leaderboard. Please refresh the page and try again.</p>
      </div>
    );
  }
}
