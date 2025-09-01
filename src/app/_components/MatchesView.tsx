"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { Horse } from "@/lib/horses";

export default function MatchesView({ matches, onRemove }: { matches: Horse[]; onRemove?: (name: string) => void }) {
  const [selectedHorse, setSelectedHorse] = useState<Horse | null>(null);

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
          <button key={horse.name} type="button" onClick={() => setSelectedHorse(horse)} className="bg-neutral-900 p-4 rounded-lg flex flex-col items-center border border-gray-700 w-64 text-left hover:border-neutral-500 focus-visible:outline-none focus-visible:ring-2 ring-yellow-400/60">
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
              {onRemove && (
                <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(horse.name); }} className="text-[11px] text-red-300 hover:text-red-200 underline">
                  Remove
                </button>
              )}
            </div>
          </button>
        ))}
      </div>

      {selectedHorse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSelectedHorse(null)} aria-hidden="true" />
          <div className="relative z-10 w-80 sm:w-[28rem]">
            <div className="bg-neutral-900/95 backdrop-blur p-6 rounded-2xl border border-gray-700 shadow-2xl text-left max-h-[90vh] overflow-y-auto">
              {/^https?:\/\//.test(selectedHorse.image) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedHorse.image} alt={`Photo of ${selectedHorse.name}`} className="rounded-lg w-full h-auto" loading="lazy" decoding="async" onError={(e) => { try { const img = e.currentTarget as HTMLImageElement; if (!img.src.includes("Tinder-for-Horses-cover-image")) { img.src = "/TFH/Tinder-for-Horses-cover-image.png"; } } catch {} }} />
              ) : (
                <Image src={selectedHorse.image} alt={`Photo of ${selectedHorse.name}`} width={500} height={350} className="rounded-lg w-full h-auto" onError={(e) => { try { const img = e.currentTarget as HTMLImageElement; if (!img.src.includes("Tinder-for-Horses-cover-image")) { img.src = "/TFH/Tinder-for-Horses-cover-image.png"; } } catch {} }} />
              )}
              <h3 className="text-2xl font-semibold mt-4">{selectedHorse.name}, {selectedHorse.age}</h3>
              <p className="text-sm text-gray-300 mt-1">{selectedHorse.breed} • {selectedHorse.gender} • {selectedHorse.heightCm} cm • {selectedHorse.location}</p>
              <p className="text-sm text-gray-300 mt-1">Color: {selectedHorse.color} • Temperament: {selectedHorse.temperament}</p>
              <p className="text-sm text-gray-300 mt-2">{selectedHorse.description}</p>
              <div className="flex flex-wrap gap-2 mt-3">{selectedHorse.interests.map((interest) => (<span key={interest} className="text-xs bg-pink-600/20 border border-pink-500/20 text-pink-200 px-2 py-1 rounded-full">{interest}</span>))}</div>
              {selectedHorse.disciplines.length > 0 && (<div className="flex flex-wrap gap-2 mt-2">{selectedHorse.disciplines.map((d) => (<span key={d} className="text-xs bg-blue-600/20 border border-blue-500/20 text-blue-200 px-2 py-1 rounded-full">{d}</span>))}</div>)}
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setSelectedHorse(null)} className="rounded border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-700">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
