"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import type { Horse } from "@/lib/horses";
import HorseSwiper from "./HorseSwiper";
import MatchesView from "./MatchesView";
import { useTfhMatches, useDeckIndex, useTfhFilters, TFH_EVENTS } from "@/lib/tfh";
import FiltersModal from "./FiltersModal";

export default function TfhClient({ horses }: { horses: Horse[] }) {
  const baseList = useMemo(() => horses ?? [], [horses]);
  const { matches, addMatch } = useTfhMatches(baseList);
  const onRate = (h: Horse, liked: boolean) => {
    if (liked) addMatch(h);
  };
  const [tab, setTab] = useState<"browse" | "matches">("browse");

  const { gender, minAge, maxAge } = useTfhFilters();
  const filtered = useMemo(() => {
    return baseList.filter((h) => {
      if (gender !== "All" && h.gender !== gender) return false;
      if (minAge !== "" && h.age < minAge) return false;
      if (maxAge !== "" && h.age > maxAge) return false;
      return true;
    });
  }, [baseList, gender, minAge, maxAge]);
  const [index, setIndex] = useDeckIndex(Math.max(0, filtered.length - 1));

  useEffect(() => {
    const onReset = () => {
      setIndex(0);
      setTab("browse");
    };
    window.addEventListener(TFH_EVENTS.RESET, onReset as EventListener);
    return () => window.removeEventListener(TFH_EVENTS.RESET, onReset as EventListener);
  }, [setIndex]);

  const swiperControls = useRef<{ like: () => void; dislike: () => void; canAct: () => boolean } | null>(null);

  return (
    <div className="relative z-10 h-full w-full">
      <div className="flex flex-col h-full">
        <div className="flex-1 p-3 sm:p-6 flex flex-col items-stretch">
          {tab === "browse" ? (
            <>
              <HorseSwiper onRate={onRate} horses={filtered} index={index} onIndexChange={setIndex} controlsRef={swiperControls} showActions={false} />
              <div className="mt-3 flex items-center justify-center gap-10 h-14 sm:h-16">
                <button onClick={() => swiperControls.current?.dislike()} className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition" aria-label="Dislike">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><path fillRule="evenodd" d="M6.225 5.811a1 1 0 0 1 1.414 0L12 10.172l4.361-4.361a1 1 0 1 1 1.414 1.414L13.414 11.586l4.361 4.361a1 1 0 1 1-1.414 1.414L12 13.414l-4.361 4.361a1 1 0 0 1-1.414-1.414l4.361-4.361-4.361-4.361a1 1 0 0 1 0-1.414z" clipRule="evenodd" /></svg>
                </button>
                <button onClick={() => swiperControls.current?.like()} className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-white transition" aria-label="Like">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><path d="M11.645 20.87l-.007-.003-.022-.012a15.247 15.247 0 0 1-.382-.226 25.18 25.18 0 0 1-4.415-3.194C4.06 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-2.06 6.86-5.32 9.94a25.172 25.172 0 0 1-4.415 3.194 15.247 15.247 0 0 1-.382.226l-.022.012-.007.003a.75.75 0 0 1-.664 0z" /></svg>
                </button>
              </div>
            </>
          ) : (
            <MatchesView matches={matches} />
          )}
        </div>
        {/* Mobile bottom navbar */}
        <div className="md:hidden shrink-0">
          <div className="mx-auto w-full max-w-md px-3 py-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
            <div className="grid grid-cols-5 gap-2">
              <button type="button" onClick={() => setTab("browse")} className={`h-12 w-full text-[11px] inline-flex items-center justify-center gap-1 rounded-lg transition min-w-0 ${tab === "browse" ? "bg-neutral-800/90 text-white ring-1 ring-neutral-700/50 shadow-inner" : "bg-neutral-900/70 text-neutral-300 hover:bg-neutral-800/60"}`}>
                <span aria-hidden className="text-base">🏇</span>
                <span className="hidden sm:inline whitespace-nowrap truncate">Discover</span>
              </button>
              <button type="button" onClick={() => setTab("matches")} className={`h-12 w-full text-[11px] inline-flex items-center justify-center gap-1 rounded-lg transition min-w-0 ${tab === "matches" ? "bg-neutral-800/90 text-white ring-1 ring-neutral-700/50 shadow-inner" : "bg-neutral-900/70 text-neutral-300 hover:bg-neutral-800/60"}`}>
                <span className="relative inline-flex">
                  <span aria-hidden className="text-base">❤️</span>
                  {matches.length > 0 && (
                    <span className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 inline-flex items-center justify-center">
                      <span className="absolute inset-0 rounded-full bg-amber-400 opacity-60 animate-ping" aria-hidden="true" />
                      <span className="relative min-w-[0.9rem] h-[0.9rem] px-[2px] rounded-full bg-amber-400 text-black text-[9px] font-semibold leading-[0.9rem] text-center ring-1 ring-black/50 shadow-md" aria-label={`${matches.length} matches`}>
                        {matches.length}
                      </span>
                    </span>
                  )}
                </span>
                <span className="hidden sm:inline whitespace-nowrap truncate">Matches{matches.length ? ` (${matches.length})` : ""}</span>
              </button>
              <button type="button" aria-label="Open filters" title="Filters" onClick={() => { try { window.dispatchEvent(new CustomEvent(TFH_EVENTS.OPEN_FILTERS)); } catch {} }} className="h-12 w-full text-[11px] inline-flex items-center justify-center gap-1 rounded-lg transition bg-neutral-900/70 text-neutral-300 hover:bg-neutral-800/60 min-w-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M3 4.5A1.5 1.5 0 0 1 4.5 3h15a1.5 1.5 0 0 1 1.2 2.4l-6.3 8.4v4.35a1.5 1.5 0 0 1-.87 1.36l-3 1.5A1.5 1.5 0 0 1 8 19.5v-6.21L3.3 5.4A1.5 1.5 0 0 1 3 4.5z" clipRule="evenodd" /></svg>
                <span className="hidden sm:inline whitespace-nowrap truncate">Filters</span>
              </button>
              <button type="button" aria-label="Project info" title="Project info" onClick={() => { try { window.dispatchEvent(new CustomEvent("tfh:toggle-project-info")); } catch {} }} className="h-12 w-full text-[11px] inline-flex items-center justify-center gap-1 rounded-lg transition bg-neutral-900/70 text-neutral-300 hover:bg-neutral-800/60 min-w-0">
                <span aria-hidden className="text-base">ℹ️</span>
                <span className="hidden sm:inline whitespace-nowrap truncate">Info</span>
              </button>
              <a href="/new" className="h-12 w-full text-[11px] inline-flex items-center justify-center gap-1 rounded-lg transition bg-neutral-900/70 text-neutral-300 hover:bg-neutral-800/60 min-w-0">
                <span aria-hidden className="text-base">➕</span>
                <span className="hidden sm:inline whitespace-nowrap truncate">Add</span>
              </a>
            </div>
          </div>
        </div>
      </div>
      <FiltersModal />
    </div>
  );
}
