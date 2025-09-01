"use client";

import React, { useMemo, useRef, useState } from "react";
import type { Horse } from "@/lib/horses";
import HorseSwiper from "./HorseSwiper";
import MatchesView from "./MatchesView";
import { useTfhMatches, useDeckIndex } from "@/lib/tfh";

export default function TfhClient({ horses }: { horses: Horse[] }) {
  const baseList = useMemo(() => horses ?? [], [horses]);
  const { matches, addMatch } = useTfhMatches(baseList);
  const [index, setIndex] = useDeckIndex(Math.max(0, baseList.length - 1));
  const onRate = (h: Horse, liked: boolean) => {
    if (liked) addMatch(h);
  };
  const [tab, setTab] = useState<"browse" | "matches">("browse");

  return (
    <div className="relative z-10 h-full w-full">
      <div className="flex flex-col md:flex-row h-full">
        <div className="flex-1 p-3 sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <button onClick={() => setTab("browse")} className={`text-sm px-3 py-1.5 rounded border ${tab === "browse" ? "bg-neutral-800 border-neutral-600" : "bg-neutral-900 border-neutral-800"}`}>Browse</button>
            <button onClick={() => setTab("matches")} className={`text-sm px-3 py-1.5 rounded border ${tab === "matches" ? "bg-neutral-800 border-neutral-600" : "bg-neutral-900 border-neutral-800"}`}>Matches <span className="ml-1 text-xs text-pink-300">({matches.length})</span></button>
          </div>
          {tab === "browse" ? (
            <HorseSwiper onRate={onRate} horses={baseList} index={index} onIndexChange={setIndex} />
          ) : (
            <MatchesView matches={matches} />
          )}
        </div>
      </div>
    </div>
  );
}
