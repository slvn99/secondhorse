"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import Image from "next/image";
import type { Horse } from "@/lib/horses";
import ConfirmDialog from "./ConfirmDialog";
import { useTfhUI } from "@/lib/tfh";
import type { NormalizedProfileIdentifier } from "@/lib/profileIds";
import { profileUrlFor } from "@/lib/profilePath";
import { PROFILE_SHARE_TEXT, shareWithNativeOrCopy } from "@/lib/share";

type ProfileModalProps = {
  horse?: Horse | null;
  externalIdentifier?: NormalizedProfileIdentifier | null;
  onClose?: () => void;
  onRemove?: (name: string) => void;
  variant?: "modal" | "standalone";
};

export default function ProfileModal({
  horse,
  externalIdentifier,
  onClose = () => {},
  onRemove,
  variant = "modal",
}: ProfileModalProps) {
  const isModal = variant === "modal";
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { pushOverlay, popOverlay } = useTfhUI();
  const [resolvedHorse, setResolvedHorse] = useState<Horse | null>(horse ?? null);
  const [loading, setLoading] = useState<boolean>(!horse && !!externalIdentifier);
  const [error, setError] = useState<string | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "error">("idle");
  useEffect(() => {
    setResolvedHorse(horse ?? null);
  }, [horse]);

  useEffect(() => {
    if (!externalIdentifier || horse) return;
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`/api/profile/${encodeURIComponent(externalIdentifier.key)}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load profile");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (data?.horse) {
          setResolvedHorse(data.horse as Horse);
        } else {
          setError("Profile unavailable");
        }
      })
      .catch((err) => {
        if (cancelled || err.name === "AbortError") return;
        setError("Profile unavailable");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [externalIdentifier, horse]);

  const gallery = useMemo(() => {
    if (!resolvedHorse) return [];
    const arr =
      Array.isArray(resolvedHorse.photos) && resolvedHorse.photos.length
        ? resolvedHorse.photos
        : [resolvedHorse.image];
    return arr.filter((u): u is string => typeof u === "string" && u.length > 0);
  }, [resolvedHorse]);
  const prevPhoto = () => setPhotoIndex((i) => (i > 0 ? i - 1 : i));
  const nextPhoto = () => setPhotoIndex((i) => (i < gallery.length - 1 ? i + 1 : i));
  // Basic touch swipe for mobile
  const touchStartX = useRef<number | null>(null);
  const shareResetRef = useRef<number | null>(null);
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
    setPhotoIndex(0);
  }, [resolvedHorse?.name]);

  useEffect(() => {
    if (!isModal) return undefined;
    pushOverlay();
    return () => popOverlay();
  }, [isModal, pushOverlay, popOverlay]);

  useEffect(() => () => {
    if (shareResetRef.current) {
      window.clearTimeout(shareResetRef.current);
    }
  }, []);

  const horseName = resolvedHorse?.name ?? externalIdentifier?.key ?? "Profile";

  const containerClasses = isModal
    ? "w-full max-w-md sm:max-w-lg bg-neutral-900/95 backdrop-blur rounded-2xl border border-gray-700 shadow-2xl text-left overflow-hidden flex flex-col"
    : "w-full max-w-3xl bg-neutral-900/95 backdrop-blur rounded-2xl border border-gray-700 shadow-2xl text-left overflow-hidden flex flex-col";
  const containerStyle = isModal
    ? {
        maxHeight:
          "calc(100dvh - var(--footer-height, 3rem) - env(safe-area-inset-bottom) - 4rem)",
      }
    : undefined;

  const card = (
    <div
      className={containerClasses}
      style={containerStyle}
      role={isModal ? "dialog" : "region"}
      aria-modal={isModal ? "true" : undefined}
      data-testid="profile-modal"
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-neutral-800/80 bg-neutral-900/95">
          <h3 className="text-xl sm:text-2xl font-semibold truncate">
            {resolvedHorse ? `${resolvedHorse.name}, ${resolvedHorse.age}` : horseName}
          </h3>
          <div className="flex items-center gap-2">
            {resolvedHorse && (
              <button
                type="button"
                title="Share profile"
                aria-label="Share profile"
                className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-neutral-700 hover:bg-neutral-800 text-blue-300 hover:text-blue-200"
                onClick={async () => {
                  if (!resolvedHorse) return;
                  try {
                    const link = profileUrlFor(window.location.origin, resolvedHorse, externalIdentifier);
                    if (!link) {
                      setShareStatus("error");
                      if (shareResetRef.current) window.clearTimeout(shareResetRef.current);
                      shareResetRef.current = window.setTimeout(() => setShareStatus("idle"), 1600);
                      return;
                    }
                    const outcome = await shareWithNativeOrCopy({
                      title: `${resolvedHorse.name} - Second Horse Dating`,
                      text: PROFILE_SHARE_TEXT,
                      url: link,
                    });
                    if (outcome === "copied" || outcome === "failed" || outcome === "unsupported") {
                      setShareStatus(outcome === "copied" ? "copied" : "error");
                      if (shareResetRef.current) window.clearTimeout(shareResetRef.current);
                      shareResetRef.current = window.setTimeout(() => setShareStatus("idle"), 1600);
                    } else if (outcome === "shared" || outcome === "cancelled") {
                      setShareStatus("idle");
                    }
                  } catch {
                    setShareStatus("error");
                    if (shareResetRef.current) window.clearTimeout(shareResetRef.current);
                    shareResetRef.current = window.setTimeout(() => setShareStatus("idle"), 1600);
                  }
                }}
              >
                {shareStatus === "copied" ? (
                  <span className="text-[11px] font-semibold text-emerald-300">OK</span>
                ) : shareStatus === "error" ? (
                  <span className="text-[11px] font-semibold text-red-300">ERR</span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0-12l-4 4m4-4l4 4" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
                  </svg>
                )}
              </button>
            )}
            <span className="sr-only" aria-live="polite">
              {shareStatus === "copied"
                ? "Profile link copied to clipboard."
                : shareStatus === "error"
                ? "Unable to share profile."
                : ""}
            </span>
          </div>
        </div>
        {/* Body */}
        <div className="px-5 py-4 overflow-y-auto flex-1 min-h-0" style={{ WebkitOverflowScrolling: "touch" }}>
          {!resolvedHorse ? (
            <div className="py-20 text-center text-neutral-300">
              {loading ? "Loading profile..." : error ?? "Profile unavailable."}
            </div>
          ) : (
            <>
              <div className="relative" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} data-testid="profile-image">
                {/^https?:\/\//.test(gallery[photoIndex] || "") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={gallery[photoIndex]}
                    alt={`Photo ${photoIndex + 1} of ${gallery.length} - ${resolvedHorse.name}`}
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
                    alt={`Photo ${photoIndex + 1} of ${gallery.length} - ${resolvedHorse.name}`}
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
                      &lt;
                    </button>
                    <button
                      type="button"
                      aria-label="Next photo"
                      title="Next photo"
                      onClick={nextPhoto}
                      className="absolute inset-y-0 right-0 my-auto mr-1 h-9 w-9 rounded-full bg-black/40 text-white grid place-items-center hover:bg-black/50 disabled:opacity-40"
                      disabled={photoIndex === gallery.length - 1}
                    >
                      &gt;
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {gallery.map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          aria-label={`Go to photo ${index + 1}`}
                          onClick={() => setPhotoIndex(index)}
                          className={`h-1.5 w-1.5 rounded-full ${index === photoIndex ? "bg-white" : "bg-white/50 hover:bg-white/70"}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-300 mt-4">
                {resolvedHorse.breed} | {resolvedHorse.gender} | {resolvedHorse.heightCm} cm | {resolvedHorse.location}
              </p>
              {resolvedHorse.color && resolvedHorse.temperament && (
                <p className="text-sm text-gray-300 mt-1">
                  Color: {resolvedHorse.color} | Temperament: {resolvedHorse.temperament}
                </p>
              )}
              {resolvedHorse.description && (
                <p className="text-sm text-gray-300 mt-2">{resolvedHorse.description}</p>
              )}
              {Array.isArray(resolvedHorse.interests) && resolvedHorse.interests.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {resolvedHorse.interests.map((interest) => (
                    <span key={interest} className="text-xs bg-pink-600/20 border border-pink-500/20 text-pink-200 px-2 py-1 rounded-full">
                      {interest}
                    </span>
                  ))}
                </div>
              )}
              {Array.isArray(resolvedHorse.disciplines) && resolvedHorse.disciplines.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {resolvedHorse.disciplines.map((discipline) => (
                    <span key={discipline} className="text-xs bg-blue-600/20 border border-blue-500/20 text-blue-200 px-2 py-1 rounded-full">
                      {discipline}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        {/* Footer */}
        <div className="px-5 py-3 flex items-center justify-end gap-3 border-t border-neutral-800/80 bg-neutral-900/95">
          {onRemove && resolvedHorse && (
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
          {isModal && (
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm font-medium text-neutral-200 hover:bg-neutral-700"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const confirmDialog = onRemove && resolvedHorse ? (
    <ConfirmDialog
      open={confirmOpen}
      title="Unmatch this profile?"
      message={
        <span>
          This will remove <strong>{resolvedHorse.name}</strong> from your matches.
        </span>
      }
      confirmText="Unmatch"
      cancelText="Cancel"
      onCancel={() => setConfirmOpen(false)}
      onConfirm={() => {
        try {
          onRemove?.(resolvedHorse.name);
        } finally {
          setConfirmOpen(false);
          onClose();
        }
      }}
    />
  ) : null;

  if (!isModal) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6">
        {card}
        {confirmDialog}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1300]">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 flex min-h-full items-start justify-center px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] sm:px-6 sm:pb-6 sm:pt-8">
        {card}
      </div>
      {confirmDialog}
    </div>
  );
}
