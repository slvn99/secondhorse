"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import type { Horse } from "@/lib/horses";

export default function ProfileModal({ horse, onClose }: { horse: Horse; onClose: () => void }) {
  useEffect(() => {
    try { window.dispatchEvent(new CustomEvent('tfh:overlay', { detail: { open: true } })); } catch {}
    return () => { try { window.dispatchEvent(new CustomEvent('tfh:overlay', { detail: { open: false } })); } catch {} };
  }, []);

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-80 sm:w-[28rem]">
        <div
          className="bg-neutral-900/95 backdrop-blur p-6 rounded-2xl border border-gray-700 shadow-2xl text-left overflow-y-auto overscroll-contain"
          style={{ maxHeight: 'calc(100dvh - var(--footer-height, 3rem) - env(safe-area-inset-bottom) - 1.5rem)' }}
        >
          {/^https?:\/\//.test(horse.image) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={horse.image}
              alt={`Photo of ${horse.name}`}
              className="rounded-lg w-full h-auto"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                try {
                  const img = e.currentTarget as HTMLImageElement;
                  if (!img.src.includes("Tinder-for-Horses-cover-image")) {
                    img.src = "/TFH/Tinder-for-Horses-cover-image.png";
                  }
                } catch {}
              }}
            />
          ) : (
            <Image
              src={horse.image}
              alt={`Photo of ${horse.name}`}
              width={500}
              height={350}
              className="rounded-lg w-full h-auto"
              onError={(e) => {
                try {
                  const img = e.currentTarget as HTMLImageElement;
                  if (!img.src.includes("Tinder-for-Horses-cover-image")) {
                    img.src = "/TFH/Tinder-for-Horses-cover-image.png";
                  }
                } catch {}
              }}
            />
          )}
          <h3 className="text-2xl font-semibold mt-4">{horse.name}, {horse.age}</h3>
          <p className="text-sm text-gray-300 mt-1">{horse.breed} • {horse.gender} • {horse.heightCm} cm • {horse.location}</p>
          {horse.color && horse.temperament && (
            <p className="text-sm text-gray-300 mt-1">Color: {horse.color} • Temperament: {horse.temperament}</p>
          )}
          {horse.description && (
            <p className="text-sm text-gray-300 mt-2">{horse.description}</p>
          )}
          {Array.isArray(horse.interests) && horse.interests.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">{horse.interests.map((interest) => (
              <span key={interest} className="text-xs bg-pink-600/20 border border-pink-500/20 text-pink-200 px-2 py-1 rounded-full">{interest}</span>
            ))}</div>
          )}
          {Array.isArray(horse.disciplines) && horse.disciplines.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">{horse.disciplines.map((d) => (
              <span key={d} className="text-xs bg-blue-600/20 border border-blue-500/20 text-blue-200 px-2 py-1 rounded-full">{d}</span>
            ))}</div>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-700">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

