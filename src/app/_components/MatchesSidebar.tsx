"use client";

import React from "react";
import Image from "next/image";
import { horses as allHorses } from "@/lib/horses";
import { useTfhMatches, TFH_EVENTS } from "@/lib/tfh";
import type { Horse } from "@/lib/horses";
import ProfileModal from "./ProfileModal";
import ConfirmDialog from "./ConfirmDialog";

export default function MatchesSidebar() {
  const { matches, removeMatch } = useTfhMatches(allHorses);
  const [collapsed, setCollapsed] = React.useState(false);
  const [selectedHorse, setSelectedHorse] = React.useState<Horse | null>(null);
  const [confirmName, setConfirmName] = React.useState<string | null>(null);

  const shareProfile = async (name: string) => {
    try {
      const u = new URL(window.location.href);
      u.searchParams.set("p", encodeURIComponent(name));
      u.searchParams.delete("id");
      const link = u.toString();
      const title = `${name} – Second Horse Dating`;
      const text = "Check out this profile on secondhorse.nl, a dating app for horses.";
      if ((navigator as any).share) {
        try { await (navigator as any).share({ title, text, url: link }); return; } catch (err: any) { if (err && (err.name === "AbortError" || err.name === "NotAllowedError")) return; }
      }
      try { await navigator.clipboard.writeText(`${text}\n${link}`); } catch {}
    } catch {}
  };

  return (
    <>
    <aside
      className={[
        "relative hidden md:block shrink-0 border-r border-neutral-800 bg-neutral-900/80 text-neutral-100 backdrop-blur",
        // Prevent any horizontal overflow/scrollbar flicker during width animation
        "h-[calc(100dvh-var(--footer-height,3rem))] overflow-x-hidden overflow-y-hidden overscroll-x-none transition-[width] duration-200 ease-in-out",
        collapsed ? "md:w-12" : "md:w-80",
      ].join(" ")}
    >
      <div className="flex h-full flex-col min-w-0">
        <div
          className={`border-b border-neutral-800 bg-neutral-900/80 px-2 py-2 overflow-x-hidden ${
            collapsed ? "flex flex-col items-center gap-1" : "flex items-center justify-between gap-2"
          }`}
        >
          <button
            type="button"
            aria-label={collapsed ? "Expand matches" : "Collapse matches"}
            onClick={() => setCollapsed((v) => !v)}
            className="inline-flex items-center justify-center rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-100 hover:bg-neutral-700"
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? ">" : "<"}
          </button>
          {collapsed ? null : (
            <div className="flex items-center gap-2 min-w-0">
              <span className="truncate text-sm font-medium text-neutral-200">Matches</span>
              {matches.length > 0 && (
                <span className="relative inline-flex items-center justify-center">
                  <span
                    className="absolute inset-0 rounded-full bg-amber-400 opacity-60 animate-ping"
                    aria-hidden="true"
                  />
                  <span
                    className="relative min-w-[0.95rem] h-[0.95rem] px-[2px] rounded-full bg-amber-400 text-black text-[10px] font-semibold leading-[0.95rem] text-center ring-1 ring-black/50 shadow-md"
                    aria-label={`${matches.length} matches`}
                  >
                    {matches.length}
                  </span>
                </span>
              )}
            </div>
          )}
          {collapsed && (
            <div className="flex items-center justify-center gap-1 mt-1">
              <span aria-hidden className="text-sm">❤️</span>
              {matches.length > 0 && (
                <span
                  className="relative min-w-[0.8rem] h-[0.8rem] px-[2px] rounded-full bg-amber-400 text-black text-[9px] font-semibold leading-[0.8rem] text-center ring-1 ring-black/50 shadow"
                  aria-label={`${matches.length} matches`}
                  title={`${matches.length} matches`}
                >
                  {matches.length}
                </span>
              )}
            </div>
          )}
          {!collapsed && (
            <button
              type="button"
              aria-label="Open filters"
              title="Filters"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("tfh:open-filters"));
                }
              }}
              className="inline-flex items-center justify-center rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-100 hover:bg-neutral-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M3 4.5A1.5 1.5 0 0 1 4.5 3h15a1.5 1.5 0 0 1 1.2 2.4l-6.3 8.4v4.35a1.5 1.5 0 0 1-.87 1.36l-3 1.5A1.5 1.5 0 0 1 8 19.5v-6.21L3.3 5.4A1.5 1.5 0 0 1 3 4.5z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
        {collapsed ? (
          // Keep footer pinned to bottom by occupying remaining space
          <div className="flex-1" />
        ) : (
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {matches.length === 0 && (
              <p className="text-xs text-neutral-400">No matches yet. Start discovering!</p>
            )}
            {matches.map((horse) => (
              <div key={horse.name} className="group flex w-full items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900/60 p-3 hover:border-neutral-600">
                <button
                  type="button"
                  onClick={() => setSelectedHorse(horse)}
                  className="flex items-center gap-3 min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 ring-yellow-400/60 flex-1"
                  title={`${horse.breed} • ${horse.location}`}
                >
                  <div className="w-20 h-20 rounded-md overflow-hidden bg-neutral-800 flex items-center justify-center shrink-0">
                    <Image src={horse.image} alt={`Photo of ${horse.name}`} width={80} height={80} className="object-cover w-20 h-20" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-200 truncate">{horse.name}, {horse.age}</p>
                    <p className="text-xs text-neutral-400 truncate">{horse.breed} • {horse.gender} • {horse.heightCm} cm</p>
                    <p className="text-xs text-neutral-400 truncate">{horse.location}</p>
                    <span className="mt-0.5 inline-block text-[11px] text-neutral-300 underline">View full profile</span>
                  </div>
                </button>
                <div className="flex items-center gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => shareProfile(horse.name)} title="Share profile" aria-label="Share profile" className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-neutral-700 hover:bg-neutral-800 text-blue-300 hover:text-blue-200">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0-12l-4 4m4-4l4 4" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
                    </svg>
                  </button>
                  <button type="button" onClick={() => setConfirmName(horse.name)} title="Unmatch" aria-label="Unmatch" className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-neutral-700 hover:bg-neutral-800 text-red-300 hover:text-red-200">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M6.225 5.811a1 1 0 0 1 1.414 0L12 10.172l4.361-4.361a1 1 0 1 1 1.414 1.414L13.414 11.586l4.361 4.361a1 1 0 1 1-1.414 1.414L12 13.414l-4.361 4.361a1 1 0 0 1-1.414-1.414l4.361-4.361-4.361-4.361a1 1 0 0 1 0-1.414z" clipRule="evenodd" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Footer action area */}
        {!collapsed ? (
          <div className="shrink-0 border-t border-neutral-800 bg-neutral-900/80 px-3 py-3 overflow-x-hidden min-w-0">
            <a
              href="/new"
              className="w-full max-w-full min-w-0 inline-flex items-center justify-center rounded-lg bg-yellow-500 text-black text-sm font-medium px-3 py-2 hover:bg-yellow-400 overflow-hidden whitespace-nowrap truncate h-10"
            >
              <span>Create Profile</span>
            </a>
          </div>
        ) : (
          <div className="shrink-0 border-t border-neutral-800 bg-neutral-900/80 px-2 py-3 flex items-center justify-center">
            <a
              href="/new"
              aria-label="Create Profile"
              className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-yellow-500 text-black text-base font-bold hover:bg-yellow-400"
              title="Create Profile"
            >
              +
            </a>
          </div>
        )}
      </div>
    </aside>
    {selectedHorse && (
      <ProfileModal
        horse={selectedHorse}
        onClose={() => setSelectedHorse(null)}
        onRemove={(name) => { removeMatch(name); setSelectedHorse(null); }}
      />
    )}
    <ConfirmDialog
      open={!!confirmName}
      title="Unmatch this profile?"
      message={<span>This will remove <strong>{confirmName}</strong> from your matches.</span>}
      confirmText="Unmatch"
      cancelText="Cancel"
      onCancel={() => setConfirmName(null)}
      onConfirm={() => { if (confirmName) removeMatch(confirmName); setConfirmName(null); }}
    />
    </>
  );
}
