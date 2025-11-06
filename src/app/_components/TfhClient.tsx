"use client";

import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import dynamic, { type DynamicOptionsLoadingProps } from "next/dynamic";
import type { Horse } from "@/lib/horses";
import { deriveProfileIdentifier, profileUrlFor } from "@/lib/profilePath";
import HorseSwiper from "./HorseSwiper";
import { useTfhMatches, useDeckIndex, useTfhFilters, useTfhUI, stableIdForName, TFH_STORAGE } from "@/lib/tfh";
import Toast from "./Toast";
import { useVoteQueue } from "@/app/_hooks/useVoteQueue";

let closeProfileModalRef: (() => void) | null = null;

function MatchesViewFallback() {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center text-sm text-neutral-300" role="status" aria-live="polite">
      <span className="animate-pulse">Loading matches...</span>
    </div>
  );
}

function FiltersModalFallback({ error, retry }: DynamicOptionsLoadingProps) {
  const { filtersOpen, closeFilters } = useTfhUI();
  if (!filtersOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-black/60" onClick={closeFilters} aria-hidden="true" />
      <div className="relative z-10 w-[92vw] max-w-md rounded-2xl border border-neutral-800 bg-neutral-900/95 backdrop-blur p-4 text-neutral-100 shadow-2xl" role="dialog" aria-modal="true">
        <p className="text-sm font-medium">{error ? "We could not load the filters panel." : "Loading filters..."}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-300">
          {error ? (
            <>
              <button type="button" onClick={() => retry?.()} className="rounded border border-neutral-700 bg-neutral-800 px-3 py-1.5 hover:bg-neutral-700">Retry</button>
              <button type="button" onClick={closeFilters} className="rounded border border-neutral-700 bg-neutral-900 px-3 py-1.5 hover:bg-neutral-800">Close</button>
            </>
          ) : (
            <>
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" aria-hidden="true" />
              <span>Preparing controls...</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileModalFallback({ error, retry }: DynamicOptionsLoadingProps) {
  const { pushOverlay, popOverlay } = useTfhUI();
  useEffect(() => {
    pushOverlay();
    return () => popOverlay();
  }, [pushOverlay, popOverlay]);

  const handleClose = useCallback(() => {
    closeProfileModalRef?.();
  }, []);

  return (
    <div className="fixed inset-0 z-[1300]">
      <div className="fixed inset-0 bg-black/70" onClick={handleClose} aria-hidden="true" />
      <div className="relative z-10 flex min-h-full items-center justify-center px-4 py-6">
        <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900/95 p-6 text-neutral-100 shadow-2xl" role="dialog" aria-modal="true" aria-live="assertive">
          <p className="text-sm font-medium">{error ? "We could not load the profile." : "Loading profile..."}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-neutral-300">
            {error ? (
              <>
                <button type="button" onClick={() => retry?.()} className="rounded border border-neutral-700 bg-neutral-800 px-3 py-1.5 hover:bg-neutral-700">Retry</button>
                <button type="button" onClick={handleClose} className="rounded border border-neutral-700 bg-neutral-900 px-3 py-1.5 hover:bg-neutral-800">Close</button>
              </>
            ) : (
              <>
                <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" aria-hidden="true" />
                <span>Preparing profile details...</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CoachMarksFallback() {
  return null;
}

const MatchesView = dynamic(() => import("./MatchesView"), { loading: () => <MatchesViewFallback /> });
const FiltersModal = dynamic(() => import("./FiltersModal"), { loading: (props) => <FiltersModalFallback {...props} /> });
const ProfileModal = dynamic(() => import("./ProfileModal"), { loading: (props) => <ProfileModalFallback {...props} /> });
const CoachMarks = dynamic(() => import("./CoachMarks"), { loading: () => <CoachMarksFallback /> });

export default function TfhClient({ horses }: { horses: Horse[] }) {
  const baseList = useMemo(() => horses ?? [], [horses]);
  // Ensure every horse has an id (prefer DB id, else derive a stable hash from name)
  const withIds = useMemo(() => baseList.map((h) => (h.id ? h : ({ ...h, id: `l_${stableIdForName(h.name)}` } as any))), [baseList]);
  const { matches, addMatch, removeMatch } = useTfhMatches(baseList);
  const { openFilters, overlayActive, toggleProjectInfo, resetCounter } = useTfhUI();
  const lastAction = useRef<{ horse: Horse; liked: boolean } | null>(null);
  const [undoToastOpen, setUndoToastOpen] = useState<string | null>(null);
  const [hasActedThisSession, setHasActedThisSession] = useState(false);
  const { queueVote, lastError, clearError } = useVoteQueue();
  const [voteError, setVoteError] = useState<string | null>(null);
  const [voteErrorKey, setVoteErrorKey] = useState(0);
  const onRate = (h: Horse, liked: boolean) => {
    lastAction.current = { horse: h, liked };
    try { localStorage.setItem("tfh_last_action", JSON.stringify({ name: h.name, liked })); } catch {}
    setHasActedThisSession(true);
    if (liked) {
      // Always store as liked centrally; derivation to 'matches' is handled in useTfhMatches
      addMatch(h);
    }
    queueVote(h, liked).catch(() => {});
  };
  const [tab, setTab] = useState<"browse" | "matches">("browse");
  const [modalEntry, setModalEntry] = useState<{ horse: Horse; profileKey: string } | null>(null);
  const closeModal = useCallback(() => setModalEntry(null), []);
  useEffect(() => {
    closeProfileModalRef = closeModal;
    return () => {
      if (closeProfileModalRef === closeModal) {
        closeProfileModalRef = null;
      }
    };
  }, [closeModal]);
  const urlHasTarget = useMemo(() => {
    try { const sp = new URLSearchParams(window.location.search); return !!(sp.get("id") || sp.get("p") || sp.get("profile")); } catch { return false; }
  }, []);
  const findHorseByProfileKey = useCallback(
    (profileKey: string): Horse | null => {
      const key = profileKey.trim().toLowerCase();
      if (!key) return null;
      const collections = [withIds, baseList];
      if (key.startsWith("db:")) {
        const targetId = key.slice(3);
        for (const list of collections) {
          const match = list.find((horse) => (horse.id ?? "").toLowerCase() === targetId);
          if (match) return match;
        }
        return null;
      }
      if (key.startsWith("seed:")) {
        const targetSeed = key.slice(5);
        for (const list of collections) {
          const match = list.find((horse) => {
            const horseId = (horse.id ?? "").toLowerCase();
            const hashed = stableIdForName(horse.name).toLowerCase();
            return horseId === targetSeed || horseId === `l_${targetSeed}` || hashed === targetSeed;
          });
          if (match) return match;
        }
        return null;
      }
      for (const list of collections) {
        const match = list.find(
          (horse) =>
            (horse.id ?? "").toLowerCase() === key || horse.name.toLowerCase() === key
        );
        if (match) return match;
      }
      return null;
    },
    [withIds, baseList]
  );

  const { gender, minAge, maxAge, clearFilters } = useTfhFilters();
  const [mounted, setMounted] = useState(false);
  const [kbHint, setKbHint] = useState<boolean>(false);
  useEffect(() => {
    setMounted(true);
    try { setKbHint(!localStorage.getItem("tfh_kb_hint_seen")); } catch { setKbHint(true); }
  }, []);
  const matchesCount = mounted ? matches.length : 0;
  const showMatchesBadge = matchesCount > 0;
  useEffect(() => {
    if (!lastError) return;
    setVoteError(lastError);
    setVoteErrorKey((key) => key + 1);
    clearError();
  }, [lastError, clearError]);
  useEffect(() => {
    if (!voteError) return;
    const timer = setTimeout(() => setVoteError(null), 6000);
    return () => clearTimeout(timer);
  }, [voteError]);
  const filtered = useMemo(() => {
    return withIds.filter((h) => {
      if (gender !== "All" && h.gender !== gender) return false;
      if (minAge !== "" && h.age < minAge) return false;
      if (maxAge !== "" && h.age > maxAge) return false;
      return true;
    });
  }, [withIds, gender, minAge, maxAge]);
  const [index, setIndex] = useDeckIndex(Math.max(0, filtered.length - 1));

  useEffect(() => {
    if (resetCounter === 0) return;
    setIndex(0);
    setTab("browse");
  }, [resetCounter, setIndex]);

  const swiperControls = useRef<{ like: () => void; dislike: () => void; canAct: () => boolean } | null>(null);

  // Keyboard controls: Left/Right = dislike/like, Z = undo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (tab !== "browse") return;
      if (!swiperControls.current?.canAct()) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); swiperControls.current?.dislike(); }
      if (e.key === "ArrowRight" || e.key === "Enter") { e.preventDefault(); swiperControls.current?.like(); }
      if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (index > 0) {
          setIndex(index - 1);
          const la = lastAction.current;
          if (la?.liked) removeMatch(la.horse.name);
          lastAction.current = null;
          try { localStorage.removeItem("tfh_last_action"); } catch {}
          setUndoToastOpen("Undid last swipe");
        }
      }
      if (kbHint) { try { localStorage.setItem("tfh_kb_hint_seen", "1"); } catch {} setKbHint(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, setIndex, tab, removeMatch, kbHint]);

  // Deep-linking: read ?p= or ?profile= on first mount against current filtered list
  const didInitFromQuery = useRef(false);
  // If URL includes a target id/name, clear stored deck index to let query take precedence
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("id") || sp.get("p") || sp.get("profile")) {
        localStorage.removeItem(TFH_STORAGE.INDEX);
      }
    } catch {}
  }, []);
  useEffect(() => {
    if (didInitFromQuery.current) return;
    try {
      const sp = new URLSearchParams(window.location.search);
      const profileKey = sp.get("profile");
      if (profileKey) {
        const horse = findHorseByProfileKey(profileKey);
        if (horse) {
          setModalEntry({ horse, profileKey });
          setTab("browse");
        }
        didInitFromQuery.current = true;
        return;
      }
      const qid = sp.get("id");
      const qname = sp.get("p");
      if (qid || qname) {
        const targetId = qid || (qname ? `l_${stableIdForName(decodeURIComponent(qname))}` : undefined);
        const idx = filtered.findIndex((h) => (h as any).id === targetId);
        if (idx >= 0) {
          setTimeout(() => setIndex(idx), 0);
          try { localStorage.setItem(TFH_STORAGE.INDEX, String(idx)); } catch {}
        }
      }
    } catch {}
    didInitFromQuery.current = true;
  }, [filtered, setIndex, findHorseByProfileKey, setTab]);

  // Update URL when index changes (no reload)
  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      if (modalEntry) {
        u.searchParams.set("profile", modalEntry.profileKey);
        u.searchParams.delete("id");
        u.searchParams.delete("p");
      } else if (index >= 0 && index < filtered.length) {
        const current = filtered[index];
        const identifier = deriveProfileIdentifier(current);
        if (identifier) {
          u.searchParams.set("profile", identifier.key);
        } else {
          u.searchParams.delete("profile");
        }
        u.searchParams.delete("id");
        u.searchParams.delete("p");
      } else {
        u.searchParams.delete("id");
        u.searchParams.delete("profile");
      }
      window.history.replaceState({}, "", u.toString());
    } catch {}
  }, [index, filtered, modalEntry]);

  // Restore last action on mount (for persisted undo)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tfh_last_action");
      if (raw) {
        const parsed = JSON.parse(raw);
        const h = baseList.find((x) => x.name === parsed?.name);
        if (h && typeof parsed?.liked === "boolean") {
          lastAction.current = { horse: h, liked: parsed.liked };
        }
      }
    } catch {}
  }, [baseList]);

  const undoLast = () => {
    if (index > 0) {
      setIndex(index - 1);
      const la = lastAction.current;
      if (la?.liked) removeMatch(la.horse.name);
      lastAction.current = null;
      try { localStorage.removeItem("tfh_last_action"); } catch {}
      setUndoToastOpen("Undid last swipe");
    }
  };

  return (
    <div className="relative z-10 h-full w-full">
      <div className="flex flex-col h-full">
        <div className="flex-1 p-3 sm:p-6 pb-20 md:pb-0 flex flex-col items-stretch">
          {/* Filter summary bar */}
          <div className="mb-2 -mt-1 flex flex-wrap items-center gap-2 text-[11px] text-neutral-200">
            {mounted && (
              <>
                {gender !== "All" && (<span className="rounded-full bg-pink-600/20 border border-pink-500/30 text-pink-200 px-2 py-1">{gender}</span>)}
                {minAge !== "" && (<span className="rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-200 px-2 py-1">Min {minAge}</span>)}
                {maxAge !== "" && (<span className="rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-200 px-2 py-1">Max {maxAge}</span>)}
                {(gender !== "All" || minAge !== "" || maxAge !== "") && (
                  <button type="button" onClick={clearFilters} className="ml-1 underline text-neutral-300 hover:text-white">Clear</button>
                )}
              </>
            )}
          </div>
          {tab === "browse" ? (
            <>
              <HorseSwiper
                onRate={onRate}
                horses={filtered}
                index={index}
                onIndexChange={setIndex}
                controlsRef={swiperControls}
                showActions={false}
                disableShuffle={urlHasTarget}
                onUndo={undoLast}
                showUndo={hasActedThisSession}
                onShare={async () => {
                  try {
                    const horse = index >= 0 && index < filtered.length ? filtered[index] : null;
                    const fallbackLink = window.location.origin || "";
                    const link = horse ? profileUrlFor(window.location.origin, horse) ?? fallbackLink : fallbackLink;
                    const title = horse ? `${horse.name} - Second Horse Dating` : "Second Horse Dating";
                    const text = "Check out this profile on secondhorse.nl, a dating app for horses.";
                    if (typeof navigator !== "undefined" && (navigator as any).share) {
                      try {
                        await (navigator as any).share({ title, text, url: link });
                        return;
                      } catch (err: any) {
                        // If user cancels share, do nothing; otherwise fallback
                        if (err && (err.name === "AbortError" || err.name === "NotAllowedError")) {
                          return;
                        }
                      }
                    }
                    // Fallback: copy to clipboard
                    try { await navigator.clipboard.writeText(`${text}\n${link}`); } catch {}
                    setUndoToastOpen("Share message copied");
                  } catch {}
                }}
              />
              {index < filtered.length && (
                <div className="mt-3 mb-6 sm:mb-8 flex items-center justify-center gap-10 h-14 sm:h-16">
                  <button onClick={() => swiperControls.current?.dislike()} className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition" aria-label="Dislike" title="Dislike">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><path fillRule="evenodd" d="M6.225 5.811a1 1 0 0 1 1.414 0L12 10.172l4.361-4.361a1 1 0 1 1 1.414 1.414L13.414 11.586l4.361 4.361a1 1 0 1 1-1.414 1.414L12 13.414l-4.361 4.361a1 1 0 0 1-1.414-1.414l4.361-4.361-4.361-4.361a1 1 0 0 1 0-1.414z" clipRule="evenodd" /></svg>
                  </button>
                  <button onClick={() => swiperControls.current?.like()} className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-white transition" aria-label="Like" title="Like">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><path d="M11.645 20.87l-.007-.003-.022-.012a15.247 15.247 0 0 1-.382-.226 25.18 25.18 0 0 1-4.415-3.194C4.06 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-2.06 6.86-5.32 9.94a25.172 25.172 0 0 1-4.415 3.194 15.247 15.247 0 0 1-.382.226l-.022.012-.007.003a.75.75 0 0 1-.664 0z" /></svg>
                  </button>
                </div>
              )}
              {mounted && kbHint && (
                <div className="-mt-3 text-center text-[11px] text-neutral-300">Tip: use Left/Right to swipe, Z to undo</div>
              )}
              {/* Removed text undo link; dedicated button provided above. */}
            </>
          ) : (
            <MatchesView matches={matches} onRemove={(name) => removeMatch(name)} />
          )}
        </div>
        {/* Mobile bottom navbar */}
        {!overlayActive && (
        <div className="md:hidden">
          <div className="fixed inset-x-0 z-[850] bg-neutral-900/80 backdrop-blur border-t border-neutral-800 px-3 py-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]" style={{ bottom: "var(--footer-height, 3rem)" }}>
            <div className="grid grid-cols-6 gap-2">
              <button type="button" onClick={() => setTab("browse")} className={`h-12 w-full text-[11px] inline-flex items-center justify-center gap-1 rounded-lg transition min-w-0 ${tab === "browse" ? "bg-neutral-800/90 text-white ring-1 ring-neutral-700/50 shadow-inner" : "bg-neutral-900/70 text-neutral-300 hover:bg-neutral-800/60"}`}>
                <span aria-hidden className="text-base">{"\uD83D\uDC34"}</span>
                <span className="hidden sm:inline whitespace-nowrap truncate">Discover</span>
              </button>
              <button type="button" onClick={() => setTab("matches")} className={`h-12 w-full text-[11px] inline-flex items-center justify-center gap-1 rounded-lg transition min-w-0 ${tab === "matches" ? "bg-neutral-800/90 text-white ring-1 ring-neutral-700/50 shadow-inner" : "bg-neutral-900/70 text-neutral-300 hover:bg-neutral-800/60"}`}>
                <span className="relative inline-flex">
                  <span aria-hidden className="text-base">{"\u2764\uFE0F"}</span>
                  {showMatchesBadge && (
                    <span className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 inline-flex items-center justify-center">
                      <span className="absolute inset-0 rounded-full bg-amber-400 opacity-60 animate-ping" aria-hidden="true" />
                      <span className="relative min-w-[0.9rem] h-[0.9rem] px-[2px] rounded-full bg-amber-400 text-black text-[9px] font-semibold leading-[0.9rem] text-center ring-1 ring-black/50 shadow-md" aria-label={`${matchesCount} matches`}>
                        {matchesCount}
                      </span>
                    </span>
                  )}
                </span>
                <span className="hidden sm:inline whitespace-nowrap truncate">Matches{matchesCount ? ` (${matchesCount})` : ""}</span>
              </button>
              <button type="button" aria-label="Open filters" title="Filters" onClick={openFilters} className="h-12 w-full text-[11px] inline-flex items-center justify-center gap-1 rounded-lg transition bg-neutral-900/70 text-neutral-300 hover:bg-neutral-800/60 min-w-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M3 4.5A1.5 1.5 0 0 1 4.5 3h15a1.5 1.5 0 0 1 1.2 2.4l-6.3 8.4v4.35a1.5 1.5 0 0 1-.87 1.36l-3 1.5A1.5 1.5 0 0 1 8 19.5v-6.21L3.3 5.4A1.5 1.5 0 0 1 3 4.5z" clipRule="evenodd" /></svg>
                <span className="hidden sm:inline whitespace-nowrap truncate">Filters</span>
              </button>
              <button type="button" aria-label="Project info" title="Project info" onClick={toggleProjectInfo} className="h-12 w-full text-[11px] inline-flex items-center justify-center gap-1 rounded-lg transition bg-neutral-900/70 text-neutral-300 hover:bg-neutral-800/60 min-w-0">
                <span aria-hidden className="text-base">{"\u2139\uFE0F"}</span>
                <span className="hidden sm:inline whitespace-nowrap truncate">Info</span>
              </button>
              <Link href="/leaderboard" title="Leaderboard" className="h-12 w-full text-[11px] inline-flex items-center justify-center gap-1 rounded-lg transition bg-neutral-900/70 text-neutral-300 hover:bg-neutral-800/60 min-w-0">
                <span aria-hidden className="text-base">{"\uD83C\uDFC6"}</span>
                <span className="hidden sm:inline whitespace-nowrap truncate">Leaderboard</span>
              </Link>
              <a href="/new" className="h-12 w-full text-[11px] inline-flex items-center justify-center gap-1 rounded-lg transition bg-neutral-900/70 text-neutral-300 hover:bg-neutral-800/60 min-w-0">
                <span aria-hidden className="text-base">{"\u2795"}</span>
                <span className="hidden sm:inline whitespace-nowrap truncate">Add</span>
              </a>
            </div>
          </div>
        </div>
        )}
      </div>
      {modalEntry && (
        <ProfileModal
          horse={modalEntry.horse}
          onClose={closeModal}
        />
      )}
      <FiltersModal />
      {undoToastOpen && <Toast message={undoToastOpen} type="info" />}
      {voteError && <Toast key={`vote-error-${voteErrorKey}`} message={voteError} type="error" />}
      <CoachMarks />
    </div>
  );
}



