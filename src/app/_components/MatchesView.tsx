"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import type { Horse } from "@/lib/horses";
import ProfileModal from "./ProfileModal";
import ConfirmDialog from "./ConfirmDialog";

export default function MatchesView({ matches, onRemove }: { matches: Horse[]; onRemove?: (name: string) => void }) {
  const [selectedHorse, setSelectedHorse] = useState<Horse | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmName, setConfirmName] = useState<string | null>(null);

  const shareProfile = async (horse: Horse) => {
    try {
      const u = new URL(window.location.href);
      u.searchParams.set("p", encodeURIComponent(horse.name));
      u.searchParams.delete("id");
      const link = u.toString();
      const title = `${horse.name} – Second Horse Dating`;
      const text = "Check out this profile on secondhorse.nl, a dating app for horses.";
      if ((navigator as any).share) {
        try { await (navigator as any).share({ title, text, url: link }); return; } catch (err: any) { if (err && (err.name === "AbortError" || err.name === "NotAllowedError")) return; }
      }
      try { await navigator.clipboard.writeText(`${text}\n${link}`); setCopied(horse.name); setTimeout(() => setCopied(null), 1500); } catch {}
    } catch {}
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedHorse(null); };
    if (selectedHorse) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedHorse]);

  return (
    <div className="text-center space-y-4 text-white pb-[60px] md:pb-0">
      <h2 className="hidden md:block text-2xl font-bold mt-0">Matches</h2>
      {matches.length === 0 && <p>No matches yet. Better luck next time!</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 place-items-center">
        {matches.map((horse) => (
          <div
            key={horse.name}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedHorse(horse)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedHorse(horse); } }}
            className="bg-neutral-900 p-4 rounded-lg flex flex-col items-center border border-gray-700 w-64 text-left hover:border-neutral-500 focus-visible:outline-none focus-visible:ring-2 ring-yellow-400/60 cursor-pointer"
          >
            {/^https?:\/\//.test(horse.image) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={horse.image} alt={`Photo of ${horse.name}`} className="rounded-md w-[200px] h-[200px] object-cover" loading="lazy" decoding="async" onError={(e) => { try { const img = e.currentTarget as HTMLImageElement; if (!img.src.includes("Tinder-for-Horses-cover-image")) { img.src = "/TFH/Tinder-for-Horses-cover-image.png"; } } catch {} }} />
            ) : (
              <Image src={horse.image} alt={`Photo of ${horse.name}`} width={200} height={200} className="rounded-md" onError={(e) => { try { const img = e.currentTarget as HTMLImageElement; if (!img.src.includes("Tinder-for-Horses-cover-image")) { img.src = "/TFH/Tinder-for-Horses-cover-image.png"; } } catch {} }} />
            )}
            <p className="mt-2 font-semibold">{horse.name}, {horse.age}</p>
            <p className="text-xs text-gray-400">{horse.gender} • {horse.heightCm} cm</p>
            <p className="text-xs text-gray-400">{horse.breed} • {horse.location}</p>
              <div className="mt-2 flex items-center justify-between w-full">
                <span className="text-xs text-neutral-300 underline">View full profile</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); shareProfile(horse); }}
                    title="Share profile"
                    aria-label="Share profile"
                    className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-neutral-700 hover:bg-neutral-800 text-blue-300 hover:text-blue-200"
                  >
                    {copied === horse.name ? (
                      <span className="text-[10px]">OK</span>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0-12l-4 4m4-4l4 4" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
                      </svg>
                    )}
                  </button>
                  {onRemove && (
                  <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setConfirmName(horse.name); }}
                      title="Unmatch"
                      aria-label="Unmatch"
                      className="inline-flex items-center justify-center rounded-md border border-red-800/50 bg-transparent px-2.5 py-1 text-xs font-medium text-red-300 hover:bg-red-900/20"
                    >
                      Unmatch
                    </button>
                  )}
                </div>
              </div>
          </div>
        ))}
      </div>

      {selectedHorse && (
        <ProfileModal
          horse={selectedHorse}
          onClose={() => setSelectedHorse(null)}
          onRemove={onRemove ? (name) => onRemove(name) : undefined}
        />
      )}
      {onRemove && (
        <ConfirmDialog
          open={!!confirmName}
          title="Unmatch this profile?"
          message={<span>This will remove <strong>{confirmName}</strong> from your matches.</span>}
          confirmText="Unmatch"
          cancelText="Cancel"
          onCancel={() => setConfirmName(null)}
          onConfirm={() => { if (confirmName) onRemove(confirmName); setConfirmName(null); }}
        />
      )}
    </div>
  );
}
