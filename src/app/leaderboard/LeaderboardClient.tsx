"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { type LeaderboardResponse, type LeaderboardEntry } from "@/lib/voteTypes";

type LeaderboardClientProps = {
  data: LeaderboardResponse;
};

type TabId = "likes" | "dislikes";

const numberFormatter = new Intl.NumberFormat("en-US");

function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

function formatProfileAge(days: number): string {
  if (days <= 1) return "1 day old";
  return `${formatNumber(days)} days old`;
}

function badgeClass(rank: number): string {
  if (rank === 1) {
    return "bg-gradient-to-br from-yellow-400 via-yellow-200 to-yellow-500 text-black shadow-lg shadow-yellow-500/20";
  }
  if (rank === 2) {
    return "bg-gradient-to-br from-zinc-200 via-zinc-100 to-zinc-300 text-black shadow-lg shadow-zinc-400/20";
  }
  if (rank === 3) {
    return "bg-gradient-to-br from-amber-600 via-amber-500 to-amber-700 text-white shadow-lg shadow-amber-700/30";
  }
  return "bg-gradient-to-br from-pink-500 via-amber-400 to-pink-500 text-black";
}

function LeaderboardList({ entries, directionLabel }: { entries: LeaderboardEntry[]; directionLabel: string }) {
  if (!entries.length) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 px-4 py-10 text-center text-neutral-300">
        <p className="text-sm">No {directionLabel.toLowerCase()} yet. Start swiping to populate the leaderboard!</p>
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {entries.map((entry) => (
        <li
          key={entry.profileKey}
          className="rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-4 backdrop-blur-sm transition hover:border-neutral-700"
        >
            <div className="flex items-start gap-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${badgeClass(entry.rank)}`}>
              {entry.rank}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-lg font-semibold text-white truncate">{entry.displayName}</h3>
                <span className="rounded-full border border-neutral-700 bg-neutral-800/80 px-2 py-0.5 text-xs text-neutral-300">
                  {directionLabel}: {formatNumber(entry.directionCount)}
                </span>
                <span className="text-xs text-neutral-400">{formatProfileAge(entry.profileAgeDays)}</span>
              </div>
              <div className="mt-2 grid gap-2 text-sm text-neutral-300 sm:grid-cols-3">
                <div>
                  <span className="text-neutral-500">Likes:</span> {formatNumber(entry.likes)}
                </div>
                <div>
                  <span className="text-neutral-500">Dislikes:</span> {formatNumber(entry.dislikes)}
                </div>
                <div>
                  <span className="text-neutral-500">Profile ID:</span>{" "}
                  <span className="font-mono text-xs sm:text-sm text-neutral-400">{entry.id}</span>
                </div>
              </div>
            </div>
            {entry.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={entry.imageUrl}
                alt={`Photo of ${entry.displayName}`}
                className="hidden h-14 w-14 rounded-lg object-cover sm:block"
                loading="lazy"
                onError={(event) => {
                  const img = event.currentTarget;
                  if (!img.src.includes("Tinder-for-Horses-cover-image")) {
                    img.src = "/TFH/Tinder-for-Horses-cover-image.png";
                  }
                }}
              />
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function LeaderboardClient({ data }: LeaderboardClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>("likes");

  const activeEntries = useMemo(() => {
    return activeTab === "likes" ? data.likes : data.dislikes;
  }, [activeTab, data]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-300">
            See which horses are winning hearts (or stirring controversy). Likes and dislikes update as riders cast their votes.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg border border-neutral-700 bg-neutral-900/80 px-3 py-1.5 text-sm text-neutral-200 hover:border-neutral-600 hover:text-white"
        >
          Back to browsing
        </Link>
      </div>

      <section aria-labelledby="leaderboard-summary">
        <h2 id="leaderboard-summary" className="sr-only">
          Leaderboard summary metrics
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-amber-400/40 bg-amber-500/20 px-4 py-3 text-amber-100">
            <div className="text-xs uppercase tracking-wide text-amber-200/70">Active profiles</div>
            <div className="mt-1 text-2xl font-semibold text-white">{formatNumber(data.summary.totalProfiles)}</div>
          </div>
          <div className="rounded-xl border border-green-500/30 bg-green-500/15 px-4 py-3 text-emerald-100">
            <div className="text-xs uppercase tracking-wide text-emerald-200/70">Total likes</div>
            <div className="mt-1 text-2xl font-semibold text-white">{formatNumber(data.summary.totalLikes)}</div>
          </div>
          <div className="rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-3 text-rose-100">
            <div className="text-xs uppercase tracking-wide text-rose-200/70">Total dislikes</div>
            <div className="mt-1 text-2xl font-semibold text-white">{formatNumber(data.summary.totalDislikes)}</div>
          </div>
        </div>
        <p className="mt-2 text-xs text-neutral-500">Generated at {new Date(data.summary.generatedAt).toLocaleString()}</p>
      </section>

      <section aria-labelledby="leaderboard-tabs">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="leaderboard-tabs" className="text-lg font-semibold text-white">
            Explore the stats
          </h2>
          <div role="tablist" aria-label="Leaderboard categories" className="inline-flex rounded-full border border-neutral-800 bg-neutral-900/70 p-1">
            {[
              { id: "likes" as TabId, label: "Most Liked" },
              { id: "dislikes" as TabId, label: "Most Disliked" },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  id={`${tab.id}-tab`}
                  className={`rounded-full px-3 py-1.5 text-sm transition ${active ? "bg-white text-black font-semibold shadow" : "text-neutral-300 hover:text-white"}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-4" role="tabpanel" aria-labelledby={`${activeTab}-tab`}>
          <LeaderboardList
            entries={activeEntries}
            directionLabel={activeTab === "likes" ? "Likes" : "Dislikes"}
          />
        </div>
      </section>
    </div>
  );
}
