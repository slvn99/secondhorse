"use client";

import React, { useEffect } from "react";
import { useTfhFilters, useTfhUI, type GenderFilter } from "@/lib/tfh";

export default function FiltersModal() {
  const { gender, setGender, minAge, setMinAge, maxAge, setMaxAge, clearFilters } = useTfhFilters();
  const { filtersOpen, closeFilters, resetApp } = useTfhUI();

  useEffect(() => {
    if (!filtersOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFilters();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [filtersOpen, closeFilters]);

  if (!filtersOpen) return null;

  const commitClose = () => closeFilters();
  const handleResetApp = () => {
    resetApp();
    closeFilters();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-black/60" onClick={commitClose} aria-hidden="true" />
      <div className="relative z-10 w-[92vw] max-w-md">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/95 backdrop-blur p-4 text-neutral-100 shadow-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Filters</h2>
            <button onClick={commitClose} className="text-sm px-2 py-1 rounded border border-neutral-700 bg-neutral-800 hover:bg-neutral-700">Close</button>
          </div>
          <div className="mt-3 space-y-3">
            <div>
              <div className="text-sm text-neutral-300 mb-1">Gender</div>
              <div className="flex flex-wrap gap-2">
                {["All","Mare","Stallion","Gelding"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g as GenderFilter)}
                    className={`px-3 py-1.5 rounded-full text-sm border ${gender===g?"bg-yellow-500 text-black border-yellow-400":"bg-neutral-900 text-neutral-100 border-neutral-700 hover:bg-neutral-800"}`}
                    aria-pressed={gender===g}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm text-neutral-300">Min age
                <input
                  type="number"
                  min={0}
                  max={40}
                  value={minAge === "" ? "" : minAge}
                  onChange={(e) => {
                    const v = e.target.value;
                    setMinAge(v === "" ? "" : Number(v));
                  }}
                  className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 text-neutral-100 px-3 py-2"
                />
              </label>
              <label className="text-sm text-neutral-300">Max age
                <input
                  type="number"
                  min={0}
                  max={40}
                  value={maxAge === "" ? "" : maxAge}
                  onChange={(e) => {
                    const v = e.target.value;
                    setMaxAge(v === "" ? "" : Number(v));
                  }}
                  className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 text-neutral-100 px-3 py-2"
                />
              </label>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <button type="button" onClick={handleResetApp} className="text-xs sm:text-sm rounded border border-neutral-700 bg-neutral-900 text-neutral-100 px-3 py-1.5 hover:bg-neutral-800">Reset app</button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={clearFilters} className="text-xs sm:text-sm rounded border border-neutral-700 bg-neutral-900 text-neutral-100 px-3 py-1.5 hover:bg-neutral-800">Clear filters</button>
              <button type="button" onClick={commitClose} className="text-xs sm:text-sm rounded bg-yellow-500 text-black px-3 py-1.5 hover:bg-yellow-400">Done</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
