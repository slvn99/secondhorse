import type { Metadata } from "next";
import React, { type ReactNode } from "react";
import LeaderboardClient from "./LeaderboardClient";
import { generateLeaderboard } from "@/lib/leaderboard";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "See the most liked and disliked horse profiles across Second Horse Dating.",
};

export const revalidate = 60;

function ScrollContainer({ children }: { children: ReactNode }) {
  return (
    <div className="h-full w-full overflow-y-auto" data-testid="leaderboard-scroll-container">
      {children}
    </div>
  );
}

export default async function LeaderboardPage() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return (
      <ScrollContainer>
        <div className="mx-auto max-w-3xl px-4 py-16 text-center text-neutral-300">
          <h1 className="text-3xl font-semibold text-white">Leaderboard unavailable</h1>
          <p className="mt-4 text-sm">
            A database connection is required to display community stats. Configure <code className="font-mono">DATABASE_URL</code> and try again.
          </p>
        </div>
      </ScrollContainer>
    );
  }

  let data: Awaited<ReturnType<typeof generateLeaderboard>>;
  try {
    data = await generateLeaderboard({ databaseUrl });
  } catch (error) {
    console.warn("Failed to render leaderboard page:", error);
    return (
      <ScrollContainer>
        <div className="mx-auto max-w-3xl px-4 py-16 text-center text-neutral-300">
          <h1 className="text-3xl font-semibold text-white">Something went wrong</h1>
          <p className="mt-4 text-sm">We couldn&rsquo;t load the leaderboard. Please refresh the page and try again.</p>
        </div>
      </ScrollContainer>
    );
  }

  return (
    <ScrollContainer>
      <LeaderboardClient data={data} />
    </ScrollContainer>
  );
}
