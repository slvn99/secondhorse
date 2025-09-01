"use client";

import React from "react";

export default function MatchesSidebar() {
  return (
    <aside className="hidden md:flex absolute left-0 top-0 h-full w-20 bg-neutral-950/40 border-r border-neutral-800 items-center justify-center text-[10px] text-neutral-400">
      <div className="rotate-90 tracking-widest">Matches</div>
    </aside>
  );
}

