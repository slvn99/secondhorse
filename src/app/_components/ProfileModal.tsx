"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import Image from "next/image";
import type { Horse } from "@/lib/horses";
import ConfirmDialog from "./ConfirmDialog";
import { useTfhUI } from "@/lib/tfh";

export default function ProfileModal({ horse, onClose, onRemove }: { horse: Horse; onClose: () => void; onRemove?: (name: string) => void }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { pushOverlay, popOverlay } = useTfhUI();
  const gallery = useMemo(() => {
    const arr = Array.isArray(horse.photos) && horse.photos.length ? horse.photos : [horse.image];
    return arr.filter((u): u is string => typeof u === 'string' && u.length > 0);
  }, [horse]);
  const [photoIndex, setPhotoIndex] = useState(0);
  useEffect(() => { setPhotoIndex(0); }, [horse?.name]);
  const prevPhoto = () => setPhotoIndex((i) => (i > 0 ? i - 1 : i));
  const nextPhoto = () => setPhotoIndex((i) => (i < gallery.length - 1 ? i + 1 : i));
  // Basic touch swipe for mobile
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0]?.clientX ?? null; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const startX = touchStartX.current; touchStartX.current = null;
    const endX = e.changedTouches[0]?.clientX;
    if (startX == null || endX == null) return;
    const dx = endX - startX;
    const threshold = 40; // px
    if (dx > threshold) prevPhoto();
    else if (dx < -threshold) nextPhoto();
  };
  useEffect(() => {
    pushOverlay();
    return () => popOverlay();
  }, [pushOverlay, popOverlay]);

  return (
    <div className="fixed inset-0 z-[1300]">
      {/* Full-screen overlay */}
      <div className="fixed inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
      {/* Centered modal wrapper with padding separate from overlay to avoid gaps */}
      <div className="relative z-10 flex min-h-full items-start justify-center px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] sm:px-6 sm:pb-6 sm:pt-8">
        <div
          className="w-full max-w-md sm:max-w-lg bg-neutral-900/95 backdrop-blur rounded-2xl border border-gray-700 shadow-2xl text-left overflow-hidden flex flex-col"
          style={{ maxHeight: 'calc(100dvh - var(--footer-height, 3rem) - env(safe-area-inset-bottom) - 4rem)' }}
          role="dialog"
          aria-modal="true"
          data-testid="profile-modal"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-neutral-800/80 bg-neutral-900/95">
            <h3 className="text-xl sm:text-2xl font-semibold truncate">{horse.name}, {horse.age}</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                title="Share profile"
                aria-label="Share profile"
                className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-neutral-700 hover:bg-neutral-800 text-blue-300 hover:text-blue-200"
                onClick={async () => {
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
                    try { await navigator.clipboard.writeText(`${text}\n${link}`); } catch {}
                  } catch {}
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0-12l-4 4m4-4l4 4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
                </svg>
              </button>
            </div>
          </div>
          {/* Body */}
          <div className="px-5 py-4 overflow-y-auto flex-1 min-h-0" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="relative" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} data-testid="profile-image">
            {/^https?:\/\//.test(gallery[photoIndex] || '') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={gallery[photoIndex]}
                alt={`Photo ${photoIndex + 1} of ${gallery.length} – ${horse.name}`}
                className="rounded-lg w-full h-auto select-none"
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
                src={gallery[photoIndex]}
                alt={`Photo ${photoIndex + 1} of ${gallery.length} – ${horse.name}`}
                width={500}
                height={350}
                className="rounded-lg w-full h-auto select-none"
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
            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous photo"
                  title="Previous photo"
                  onClick={prevPhoto}
                  className="absolute inset-y-0 left-0 my-auto ml-1 h-9 w-9 rounded-full bg-black/40 text-white grid place-items-center hover:bg-black/50 disabled:opacity-40"
                  disabled={photoIndex === 0}
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label="Next photo"
                  title="Next photo"
                  onClick={nextPhoto}
                  className="absolute inset-y-0 right-0 my-auto mr-1 h-9 w-9 rounded-full bg-black/40 text-white grid place-items-center hover:bg-black/50 disabled:opacity-40"
                  disabled={photoIndex === gallery.length - 1}
                >
                  ›
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {gallery.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Go to photo ${i + 1}`}
                      onClick={() => setPhotoIndex(i)}
                      className={`h-1.5 w-1.5 rounded-full ${i === photoIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/70'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          <p className="text-sm text-gray-300 mt-4">{horse.breed} • {horse.gender} • {horse.heightCm} cm • {horse.location}</p>
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
          </div>
          {/* Footer */}
          <div className="px-5 py-3 flex items-center justify-end gap-3 border-t border-neutral-800/80 bg-neutral-900/95">
            {onRemove && (
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                title="Unmatch"
                aria-label="Unmatch"
                className="rounded border border-red-800/50 bg-transparent px-3 py-1.5 text-sm font-medium text-red-300 hover:bg-red-900/20"
              >
                Unmatch
              </button>
            )}
            <button type="button" onClick={onClose} className="rounded border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm font-medium text-neutral-200 hover:bg-neutral-700">Close</button>
          </div>
        </div>
      </div>
      {onRemove && (
        <ConfirmDialog
          open={confirmOpen}
          title="Unmatch this profile?"
          message={<span>This will remove <strong>{horse.name}</strong> from your matches.</span>}
          confirmText="Unmatch"
          cancelText="Cancel"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => { try { onRemove?.(horse.name); } finally { setConfirmOpen(false); onClose(); } }}
        />
      )}
    </div>
  );
}
