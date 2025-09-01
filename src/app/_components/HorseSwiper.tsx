"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import Image from "next/image";
import clsx from "clsx";
import { horses as allHorses } from "../_lib/horses";
import type { Horse } from "../_lib/horses";
import { TFH_EVENTS } from "../_lib/tfh";

export default function HorseSwiper({
  onRate,
  horses,
  index,
  onIndexChange,
  showActions = true,
  controlsRef,
}: {
  onRate?: (horse: Horse, liked: boolean) => void;
  horses?: Horse[];
  index?: number;
  onIndexChange?: (next: number) => void;
  showActions?: boolean;
  controlsRef?: MutableRefObject<
    | { like: () => void; dislike: () => void; canAct: () => boolean }
    | null
  >;
}) {
  const [internalIndex, setInternalIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const baseList = horses && horses.length > 0 ? horses : allHorses;
  const [deck, setDeck] = useState(baseList);

  const [seed, setSeed] = useState<string | null>(null);
  const xmur3 = (str: string) => {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return (h ^= h >>> 16) >>> 0; };
  };
  const mulberry32 = (a: number) => () => { let t = (a += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const scoreFor = (name: string, s: string) => { const seedFn = xmur3(`${s}|${name}`); const rnd = mulberry32(seedFn()); return rnd(); };

  useEffect(() => { try { let s = localStorage.getItem("tfh_seed"); if (!s) { s = Math.random().toString(36).slice(2); localStorage.setItem("tfh_seed", s); } setSeed(s); } catch { setSeed("default"); } }, []);
  useEffect(() => { const onReset = () => { let s = Math.random().toString(36).slice(2); try { localStorage.setItem("tfh_seed", s); } catch {} setSeed(s); }; window.addEventListener("tfh:reset", onReset as EventListener); return () => window.removeEventListener("tfh:reset", onReset as EventListener); }, []);
  useEffect(() => { if (!seed) { setDeck(baseList); return; } const arr = [...baseList].sort((a, b) => scoreFor(a.name, seed) - scoreFor(b.name, seed)); setDeck(arr); }, [baseList, seed]);

  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);
  const detailsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { const el = detailsRef.current; if (!el) return; el.style.overflow = "hidden"; el.style.willChange = "height, opacity"; el.style.transition = "height 300ms ease, opacity 300ms ease"; if (detailsOpen) { el.style.opacity = "1"; if (el.style.height === "auto") el.style.height = "0px"; el.offsetHeight; el.style.height = `${el.scrollHeight}px`; } else { if (el.style.height === "auto") { el.style.height = `${el.scrollHeight}px`; el.offsetHeight; } el.style.opacity = "0"; el.style.height = "0px"; } }, [detailsOpen]);
  useEffect(() => { const el = detailsRef.current; if (!el) return; const onEnd = (e: TransitionEvent) => { if (e.propertyName !== "height") return; if (detailsOpen) el.style.height = "auto"; }; el.addEventListener("transitionend", onEnd as any); return () => el.removeEventListener("transitionend", onEnd as any); }, [detailsOpen]);

  const controlled = useMemo(() => typeof index === "number" && !!onIndexChange, [index, onIndexChange]);
  const currentIndex = controlled ? (index as number) : internalIndex;
  const setIndex = (updater: number | ((prev: number) => number)) => { if (controlled) { const next = typeof updater === "function" ? (updater as (p: number) => number)(currentIndex) : updater; onIndexChange?.(next); } else { setInternalIndex(updater as any); } };
  useEffect(() => { if (!controlled) setInternalIndex(0); }, [deck]);
  useEffect(() => { setPhotoIdx(0); }, [currentIndex]);

  const handleChoice = (liked: boolean) => { setDirection(liked ? "right" : "left"); setTimeout(() => { onRate?.(deck[currentIndex], liked); setIndex((prev) => prev + 1); setDirection(null); }, 300); };
  useEffect(() => { if (!controlsRef) return; controlsRef.current = { like: () => { if (direction !== null || currentIndex >= deck.length) return; handleChoice(true); }, dislike: () => { if (direction !== null || currentIndex >= deck.length) return; handleChoice(false); }, canAct: () => direction === null && currentIndex < deck.length }; }, [controlsRef, direction, currentIndex, deck.length]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => { if (direction !== null) return; startX.current = e.clientX; startY.current = e.clientY; setDragging(true); try { (e.currentTarget as any).setPointerCapture?.(e.pointerId); } catch {} };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => { if (!dragging || startX.current === null || startY.current === null) return; setDx(e.clientX - startX.current); setDy(e.clientY - startY.current); };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => { if (!dragging) return; try { (e.currentTarget as any).releasePointerCapture?.(e.pointerId); } catch {} setDragging(false); const threshold = 50; if (dx > threshold) { setDx(0); setDy(0); handleChoice(true); return; } if (dx < -threshold) { setDx(0); setDy(0); handleChoice(false); return; } setDx(0); setDy(0); };

  if (currentIndex >= deck.length) {
    return (
      <div className="text-center space-y-4 text-white py-10">
        <h2 className="text-2xl font-bold">No more horses</h2>
        <p className="text-sm text-gray-300">Looks like you’ve reached the end. Try widening your filters, reshuffling the deck, or add a new profile.</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={() => { try { window.dispatchEvent(new CustomEvent(TFH_EVENTS.OPEN_FILTERS)); } catch {} }} className="rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-100 px-3 py-1.5 text-sm hover:bg-neutral-800">Open Filters</button>
          <button type="button" onClick={() => { try { window.dispatchEvent(new CustomEvent(TFH_EVENTS.RESET)); } catch {} }} className="rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-100 px-3 py-1.5 text-sm hover:bg-neutral-800">Reset Deck</button>
          <a href="/new" className="rounded-lg bg-yellow-500 text-black px-3 py-1.5 text-sm font-medium hover:bg-yellow-400">Add Profile</a>
        </div>
      </div>
    );
  }

  const horse = deck[currentIndex];
  const gallery = Array.isArray(horse?.photos) && horse!.photos.length > 0 ? (horse!.photos as string[]) : [horse?.image ?? "/TFH/Tinder-for-Horses-cover-image.png"]; 
  const shortDesc = horse.description;
  const previewInterests = horse.interests.slice(0, 3);
  const previewDisciplines = horse.disciplines.slice(0, 2);

  return (
    <div className="flex flex-col items-center gap-4 text-white h-full min-h-0 overflow-hidden px-3 pb-3 sm:pb-4">
      <div
        key={horse.name}
        className={clsx(
          "relative overflow-hidden rounded-2xl border border-white/10 w-80 sm:w-[28rem] md:w-[32rem] lg:w-[36rem] flex-1 min-h-[320px] sm:min-h-[380px] md:min-h-[420px] max-h-full shadow-xl",
          dragging && dx > 20 && "ring-2 ring-green-500/40",
          dragging && dx < -20 && "ring-2 ring-red-500/40",
          !dragging && "transition-all duration-300",
          direction === "left" && "-translate-x-[150%] opacity-0",
          direction === "right" && "translate-x-[150%] opacity-0"
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={direction ? undefined : { transform: `translate(${dx}px, ${dy * 0.2}px) rotate(${Math.max(-15, Math.min(15, dx / 12))}deg)`, cursor: dragging ? "grabbing" : "grab", userSelect: "none", touchAction: "none" }}
      >
        {/^https?:\/\//.test(gallery[photoIdx]) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={gallery[photoIdx]} alt={`Photo of ${horse.name}`} className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" onError={(e) => { try { const img = e.currentTarget as HTMLImageElement; if (!img.src.includes("Tinder-for-Horses-cover-image")) { img.src = "/TFH/Tinder-for-Horses-cover-image.png"; } } catch {} }} />
        ) : (
          <Image src={gallery[photoIdx]} alt={`Photo of ${horse.name}`} fill sizes="(max-width: 640px) 90vw, (max-width: 768px) 28rem, (max-width: 1024px) 32rem, 36rem" className="object-cover" onError={(e) => { try { const img = e.currentTarget as HTMLImageElement; if (!img.src.includes("Tinder-for-Horses-cover-image")) { img.src = "/TFH/Tinder-for-Horses-cover-image.png"; } } catch {} }} />
        )}
        {gallery.length > 1 && (
          <>
            <div className="absolute inset-y-0 left-0 right-0 z-20 flex items-center justify-between px-3 pointer-events-none">
              <button type="button" className="pointer-events-auto inline-flex items-center justify-center rounded-full bg-black/45 text-white border border-white/20 hover:bg-black/65 h-12 w-12 sm:h-14 sm:w-14" aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); setPhotoIdx((i) => (i > 0 ? i - 1 : gallery.length - 1)); }} onPointerDown={(e) => e.stopPropagation()}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 sm:h-7 sm:w-7"><path fillRule="evenodd" d="M15.78 4.22a.75.75 0 0 1 0 1.06L9.06 12l6.72 6.72a.75.75 0 1 1-1.06 1.06l-7.25-7.25a.75.75 0 0 1 0-1.06l7.25-7.25a.75.75 0 0 1 1.06 0z" clipRule="evenodd" /></svg>
              </button>
              <button type="button" className="pointer-events-auto inline-flex items-center justify-center rounded-full bg-black/45 text-white border border-white/20 hover:bg-black/65 h-12 w-12 sm:h-14 sm:w-14" aria-label="Next photo" onClick={(e) => { e.stopPropagation(); setPhotoIdx((i) => (i + 1) % gallery.length); }} onPointerDown={(e) => e.stopPropagation()}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 sm:h-7 sm:w-7"><path fillRule="evenodd" d="M8.22 19.78a.75.75 0 0 1 0-1.06L14.94 12 8.22 5.28a.75.75 0 1 1 1.06-1.06l7.25 7.25a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="absolute bottom-2 inset-x-0 z-20 flex items-center justify-center gap-1 pointer-events-none">
              {gallery.slice(0, 8).map((_, i) => (<span key={i} className={`inline-block w-2 h-2 rounded-full ${i === photoIdx ? "bg-white" : "bg-white/50"}`} />))}
              {gallery.length > 8 && <span className="text-[10px] text-white/80 ml-1">+{gallery.length - 8}</span>}
            </div>
          </>
        )}
        <button type="button" aria-label="Enlarge photo" title="Enlarge photo" className="absolute top-2 right-2 z-10 rounded-full bg-black/50 text-white p-2 border border-white/20 hover:bg-black/70" onClick={(e) => { e.stopPropagation(); setShowPhoto(true); }} onPointerDown={(e) => e.stopPropagation()}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M3.75 3A.75.75 0 0 0 3 3.75v4.5a.75.75 0 0 0 1.5 0V5.56l4.72 4.72a.75.75 0 1 0 1.06-1.06L5.56 4.5h2.69a.75.75 0 0 0 0-1.5h-4.5ZM20.25 21a.75.75 0 0 0 .75-.75v-4.5a.75.75 0 0 0-1.5 0v2.69l-4.72-4.72a.75.75 0 1 0-1.06 1.06l4.72 4.72h-2.69a.75.75 0 0 0 0 1.5h4.5Z"/><path d="M3.75 21h4.5a.75.75 0 0 0 0-1.5H5.56l4.72-4.72a.75.75 0 0 0-1.06-1.06L4.5 18.44v-2.69a.75.75 0 0 0-1.5 0v4.5c0 .414.336.75.75.75ZM20.25 3h-4.5a.75.75 0 0 0 0 1.5h2.69l-4.72 4.72a.75.75 0 0 0 1.06 1.06L19.5 5.56v2.69a.75.75 0 0 0 1.5 0v-4.5A.75.75 0 0 0 20.25 3Z"/></svg>
        </button>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
          <h3 className="text-2xl font-semibold">{horse.name}, {horse.age}</h3>
          <p className="text-sm text-gray-300 mt-1">{horse.breed} • {horse.gender} • {horse.heightCm} cm • {horse.location}</p>
          <div className="mt-2 overflow-hidden relative cursor-pointer" role="button" aria-expanded={detailsOpen} onClick={(e) => { e.stopPropagation(); setDetailsOpen((v) => !v); }} onPointerDown={(e) => e.stopPropagation()} title={detailsOpen ? "Tap to collapse" : "Tap to expand"}>
            <p className={clsx("text-sm text-gray-200 transition-all duration-300", detailsOpen ? "line-clamp-none" : "line-clamp-1")}>{shortDesc}</p>
            <div ref={detailsRef} className="text-xs text-gray-300 mt-2">
              <div className="flex flex-wrap gap-1">{previewInterests.map((i) => (<span key={i} className="bg-pink-600/20 border border-pink-500/20 text-pink-200 px-2 py-0.5 rounded-full text-xs">{i}</span>))}</div>
              {previewDisciplines.length > 0 && (<div className="mt-2 flex flex-wrap gap-1">{previewDisciplines.map((d) => (<span key={d} className="bg-blue-600/20 border border-blue-500/20 text-blue-200 px-2 py-0.5 rounded-full text-xs">{d}</span>))}</div>)}
            </div>
          </div>
        </div>
      </div>

      {showPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowPhoto(false)} aria-hidden="true" />
          <div className="relative z-10 w-[92vw] max-w-3xl">
            <div className="bg-neutral-900/95 backdrop-blur p-2 sm:p-3 rounded-2xl border border-gray-700 shadow-2xl text-left">
              {/^https?:\/\//.test(gallery[photoIdx]) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={gallery[photoIdx]} alt={`Photo of ${horse.name}`} className="rounded-lg w-full h-auto" loading="lazy" decoding="async" onError={(e) => { try { const img = e.currentTarget as HTMLImageElement; if (!img.src.includes("Tinder-for-Horses-cover-image")) { img.src = "/TFH/Tinder-for-Horses-cover-image.png"; } } catch {} }} />
              ) : (
                <Image src={gallery[photoIdx]} alt={`Photo of ${horse.name}`} width={1200} height={800} className="rounded-lg w-full h-auto" onError={(e) => { try { const img = e.currentTarget as HTMLImageElement; if (!img.src.includes("Tinder-for-Horses-cover-image")) { img.src = "/TFH/Tinder-for-Horses-cover-image.png"; } } catch {} }} />
              )}
              <div className="mt-3 flex justify-between gap-2">
                <button type="button" onClick={() => setShowPhoto(false)} className="rounded border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-700">Close</button>
                {gallery.length > 1 && (<div className="flex items-center gap-2"><button type="button" onClick={() => setPhotoIdx((i) => (i > 0 ? i - 1 : gallery.length - 1))} className="rounded border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-700">Prev</button><button type="button" onClick={() => setPhotoIdx((i) => (i + 1) % gallery.length)} className="rounded border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-700">Next</button></div>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {showActions && (
        <div className="grid grid-cols-2 gap-4 mt-2">
          <button onClick={() => handleChoice(false)} className="rounded-full bg-red-600 text-white px-4 py-2">Nope</button>
          <button onClick={() => handleChoice(true)} className="rounded-full bg-green-600 text-white px-4 py-2">Like</button>
        </div>
      )}
    </div>
  );
}

