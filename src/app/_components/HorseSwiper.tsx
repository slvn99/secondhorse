"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import Image from "next/image";
import clsx from "clsx";
import { horses as allHorses } from "@/lib/horses";
import type { Horse } from "@/lib/horses";
import { useSeed, useTfhUI, scoreForName } from "@/lib/tfh";

export default function HorseSwiper({
  onRate,
  horses,
  index,
  onIndexChange,
  showActions = true,
  controlsRef,
  disableShuffle = false,
  onUndo,
  showUndo,
  onShare,
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
  disableShuffle?: boolean;
  onUndo?: () => void;
  showUndo?: boolean;
  onShare?: () => void;
}) {
  const [internalIndex, setInternalIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const baseList = horses && horses.length > 0 ? horses : allHorses;
  const [deck, setDeck] = useState(baseList);
  const { openFilters, resetApp } = useTfhUI();
  const [seed] = useSeed();
  useEffect(() => {
    if (disableShuffle) { setDeck(baseList); return; }
    if (!seed) { setDeck(baseList); return; }
    const arr = [...baseList].sort((a, b) => scoreForName(a.name, seed) - scoreForName(b.name, seed));
    setDeck(arr);
  }, [baseList, seed, disableShuffle]);

  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsRef = useRef<HTMLDivElement | null>(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  // Smooth height/opacity animation for details
  useEffect(() => {
    const el = detailsRef.current;
    if (!el) return;
    el.style.overflow = "hidden";
    el.style.willChange = "height, opacity";
    el.style.transition = "height 300ms ease, opacity 300ms ease";
    if (detailsOpen) {
      el.style.opacity = "1";
      if (el.style.height === "auto") el.style.height = "0px";
      // force reflow
      void el.offsetHeight;
      el.style.height = `${el.scrollHeight}px`;
    } else {
      if (el.style.height === "auto") {
        el.style.height = `${el.scrollHeight}px`;
        // force reflow
        void el.offsetHeight;
      }
      el.style.opacity = "0";
      el.style.height = "0px";
    }
  }, [detailsOpen]);

  // Keep height in sync on transition end while open
  useEffect(() => {
    const el = detailsRef.current;
    if (!el) return;
    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName !== "height") return;
      if (detailsOpen) {
        el.style.height = "auto";
      }
    };
    el.addEventListener("transitionend", onEnd as any);
    return () => el.removeEventListener("transitionend", onEnd as any);
  }, [detailsOpen]);

  // details panel now uses a scrollable container with a max-height for readability on mobile

  const controlled = useMemo(() => typeof index === "number" && !!onIndexChange, [index, onIndexChange]);
  const currentIndex = controlled ? (index as number) : internalIndex;
  useEffect(() => { setImgLoaded(false); }, [currentIndex, photoIdx]);
  const incrementIndex = useCallback(() => {
    if (controlled) {
      onIndexChange?.(currentIndex + 1);
    } else {
      setInternalIndex((p) => p + 1);
    }
  }, [controlled, onIndexChange, currentIndex]);
  useEffect(() => { if (!controlled) setInternalIndex(0); }, [deck, controlled]);
  useEffect(() => { setPhotoIdx(0); }, [currentIndex]);

  const handleChoice = useCallback((liked: boolean) => {
    try { if (typeof navigator !== "undefined" && (navigator as any).vibrate) (navigator as any).vibrate(liked ? 12 : 8); } catch {}
    setDirection(liked ? "right" : "left");
    setTimeout(() => { onRate?.(deck[currentIndex], liked); incrementIndex(); setDirection(null); }, 300);
  }, [onRate, deck, currentIndex, incrementIndex]);
  useEffect(() => { if (!controlsRef) return; controlsRef.current = { like: () => { if (direction !== null || currentIndex >= deck.length) return; handleChoice(true); }, dislike: () => { if (direction !== null || currentIndex >= deck.length) return; handleChoice(false); }, canAct: () => direction === null && currentIndex < deck.length }; }, [controlsRef, direction, currentIndex, deck.length, handleChoice]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => { if (direction !== null) return; startX.current = e.clientX; startY.current = e.clientY; setDragging(true); try { (e.currentTarget as any).setPointerCapture?.(e.pointerId); } catch {} };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => { if (!dragging || startX.current === null || startY.current === null) return; setDx(e.clientX - startX.current); setDy(e.clientY - startY.current); };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => { if (!dragging) return; try { (e.currentTarget as any).releasePointerCapture?.(e.pointerId); } catch {} setDragging(false); const threshold = 50; if (dx > threshold) { setDx(0); setDy(0); handleChoice(true); return; } if (dx < -threshold) { setDx(0); setDy(0); handleChoice(false); return; } setDx(0); setDy(0); };

  // Prefetch next card's primary image for smoother swipes
  useEffect(() => {
    const next = deck[currentIndex + 1];
    if (!next) return;
    const nextUrl = Array.isArray(next.photos) && next.photos.length > 0 ? String(next.photos[0]) : String(next.image || "");
    if (!nextUrl) return;
    const isHttp = /^https?:\/\//.test(nextUrl);
    if (isHttp && typeof window !== "undefined" && (window as any).Image) {
      try {
        const pre = new window.Image();
        pre.src = nextUrl;
      } catch {}
    }
  }, [currentIndex, deck]);

  if (currentIndex >= deck.length) {
    return (
      <div className="text-center space-y-4 text-white py-10">
        <h2 className="text-2xl font-bold">No more horses</h2>
        <p className="text-sm text-gray-300">Looks like you’ve reached the end. Try widening your filters, reshuffling the deck, or add a new profile.</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={openFilters} className="rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-100 px-3 py-1.5 text-sm hover:bg-neutral-800">Open Filters</button>
          <button
            type="button"
            onClick={resetApp}
            className="rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-100 px-3 py-1.5 text-sm hover:bg-neutral-800"
          >
            Reset app
          </button>
          <a href="/new" className="rounded-lg bg-yellow-500 text-black px-3 py-1.5 text-sm font-medium hover:bg-yellow-400">Add Profile</a>
        </div>
      </div>
    );
  }

  const horse = deck[currentIndex];
  const defaultImg = "/TFH/Tinder-for-Horses-cover-image.png";
  const rawGallery = Array.isArray(horse?.photos) && horse!.photos.length > 0 ? (horse!.photos as string[]) : [horse?.image ?? ""];
  const gallery = rawGallery.map((u) => (typeof u === "string" ? u.trim() : "")).filter((u) => !!u);
  if (gallery.length === 0) gallery.push(defaultImg);
  const safeIdx = Math.max(0, Math.min(photoIdx, gallery.length - 1));
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
        {/* Swipe badges for clarity */}
        <div className="pointer-events-none absolute inset-0 z-30 select-none">
          <div
            className={clsx(
              "absolute top-3 left-3 rounded-md border-2 border-red-500/80 px-2 py-1 text-red-300 text-sm font-bold tracking-wider transition-opacity",
              dx < -15 ? "opacity-100" : "opacity-0"
            )}
            style={{ opacity: Math.max(0, Math.min(1, (-dx - 15) / 80)) }}
          >
            NOPE
          </div>
          <div
            className={clsx(
              "absolute top-3 right-3 rounded-md border-2 border-green-500/80 px-2 py-1 text-green-200 text-sm font-bold tracking-wider transition-opacity",
              dx > 15 ? "opacity-100" : "opacity-0"
            )}
            style={{ opacity: Math.max(0, Math.min(1, (dx - 15) / 80)) }}
          >
            LIKE
          </div>
        </div>
        {/^https?:\/\//.test(gallery[safeIdx]) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={gallery[safeIdx]} alt={`Photo of ${horse.name}`} className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" onLoad={() => setImgLoaded(true)} onError={(e) => { try { const img = e.currentTarget as HTMLImageElement; if (!img.src.includes("Tinder-for-Horses-cover-image")) { img.src = defaultImg; } } catch {} }} />
        ) : (
          <Image src={gallery[safeIdx] || defaultImg} alt={`Photo of ${horse.name}`} fill sizes="(max-width: 640px) 90vw, (max-width: 768px) 28rem, (max-width: 1024px) 32rem, 36rem" className="object-cover" onLoadingComplete={() => setImgLoaded(true)} />
        )}
        {!imgLoaded && (<div className="absolute inset-0 bg-neutral-800 animate-pulse" aria-hidden="true" />)}
        {gallery.length > 1 && (
          <>
            <div className="absolute inset-y-0 left-0 right-0 z-20 flex items-center justify-between px-3 pointer-events-none">
                <button type="button" className="pointer-events-auto inline-flex items-center justify-center rounded-full bg-black/45 text-white border border-white/20 hover:bg-black/65 h-12 w-12 sm:h-14 sm:w-14" aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); setPhotoIdx((i) => (i > 0 ? i - 1 : gallery.length - 1)); }} onPointerDown={(e) => e.stopPropagation()}>
                <svg suppressHydrationWarning xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 sm:h-7 sm:w-7"><path fillRule="evenodd" d="M15.78 4.22a.75.75 0 0 1 0 1.06L9.06 12l6.72 6.72a.75.75 0 1 1-1.06 1.06l-7.25-7.25a.75.75 0 0 1 0-1.06l7.25-7.25a.75.75 0 0 1 1.06 0z" clipRule="evenodd" /></svg>
              </button>
                <button type="button" className="pointer-events-auto inline-flex items-center justify-center rounded-full bg-black/45 text-white border border-white/20 hover:bg-black/65 h-12 w-12 sm:h-14 sm:w-14" aria-label="Next photo" onClick={(e) => { e.stopPropagation(); setPhotoIdx((i) => (i + 1) % gallery.length); }} onPointerDown={(e) => e.stopPropagation()}>
                <svg suppressHydrationWarning xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 sm:h-7 sm:w-7"><path fillRule="evenodd" d="M8.22 19.78a.75.75 0 0 1 0-1.06L14.94 12 8.22 5.28a.75.75 0 1 1 1.06-1.06l7.25 7.25a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="absolute bottom-2 inset-x-0 z-20 flex items-center justify-center gap-1 pointer-events-none">
              {gallery.slice(0, 8).map((_, i) => (<span key={i} className={`inline-block w-2 h-2 rounded-full ${i === photoIdx ? "bg-white" : "bg-white/50"}`} />))}
              {gallery.length > 8 && <span className="text-[10px] text-white/80 ml-1">+{gallery.length - 8}</span>}
            </div>
          </>
        )}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
          {onShare && (
            <button
              type="button"
              aria-label="Share profile"
              title="Share profile"
              className="rounded-full bg-black/50 text-white p-2 border border-white/20 hover:bg-black/70"
              onClick={(e) => { e.stopPropagation(); onShare?.(); }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <svg suppressHydrationWarning xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0-12l-4 4m4-4l4 4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
              </svg>
            </button>
          )}
          {showUndo && onUndo && (
            <button
              type="button"
              aria-label="Undo"
              title="Undo"
              className="rounded-full bg-black/50 text-white p-2 border border-white/20 hover:bg-black/70"
              onClick={(e) => { e.stopPropagation(); onUndo?.(); }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <svg suppressHydrationWarning xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0 6-6M3 9h12a6 6 0 110 12h-3" />
              </svg>
            </button>
          )}
          <button type="button" aria-label="Enlarge photo" title="Enlarge photo" className="rounded-full bg-black/50 text-white p-2 border border-white/20 hover:bg-black/70" onClick={(e) => { e.stopPropagation(); setShowPhoto(true); }} onPointerDown={(e) => e.stopPropagation()}>
            <svg suppressHydrationWarning xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M3.75 3A.75.75 0 0 0 3 3.75v4.5a.75.75 0 0 0 1.5 0V5.56l4.72 4.72a.75.75 0 1 0 1.06-1.06L5.56 4.5h2.69a.75.75 0 0 0 0-1.5h-4.5ZM20.25 21a.75.75 0 0 0 .75-.75v-4.5a.75.75 0 0 0-1.5 0v2.69l-4.72-4.72a.75.75 0 1 0-1.06 1.06l4.72 4.72h-2.69a.75.75 0 0 0 0 1.5h4.5Z"/><path d="M3.75 21h4.5a.75.75 0 0 0 0-1.5H5.56l4.72-4.72a.75.75 0 0 0-1.06-1.06L4.5 18.44v-2.69a.75.75 0 0 0-1.5 0v4.5c0 .414.336.75.75.75ZM20.25 3h-4.5a.75.75 0 0 0 0 1.5h2.69l-4.72 4.72a.75.75 0 0 0 1.06 1.06L19.5 5.56v2.69a.75.75 0 0 0 1.5 0v-4.5A.75.75 0 0 0 20.25 3Z"/></svg>
          </button>
        </div>
        <div className={clsx(
          "absolute inset-0 bg-gradient-to-t",
          // Darker gradient when expanded for readability; lighter when collapsed
          detailsOpen ? "from-black/55 via-black/30 to-transparent" : "from-black/28 via-black/12 to-transparent"
        )} />
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
          <h3 className="text-2xl font-semibold">{horse.name}, {horse.age}</h3>
          <p className="text-sm text-gray-300 mt-1">{horse.breed} • {horse.gender} • {horse.heightCm} cm • {horse.location}</p>
          <div
            className="mt-2 overflow-hidden relative cursor-pointer"
            role="button"
            aria-expanded={detailsOpen}
            onClick={(e) => { e.stopPropagation(); setDetailsOpen((v) => !v); }}
            onPointerDown={(e) => e.stopPropagation()}
            title={detailsOpen ? "Tap to collapse" : "Tap to expand"}
          >
            <p className={clsx("text-sm text-white leading-5", !detailsOpen && "line-clamp-1")}>{shortDesc}</p>
          </div>
          <div
            ref={detailsRef}
            id="tfh-details"
            className="mt-2 transition-[height,opacity] ease-in-out"
            style={{ height: 0, opacity: 0 }}
          >
            <div className="text-xs text-white/90">
              <div className="flex flex-wrap gap-1">{previewInterests.map((i) => (<span key={i} className="bg-pink-600/20 text-pink-100 px-2 py-0.5 rounded-full text-xs">{i}</span>))}</div>
              {previewDisciplines.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">{previewDisciplines.map((d) => (<span key={d} className="bg-blue-600/20 text-blue-100 px-2 py-0.5 rounded-full text-xs">{d}</span>))}</div>
              )}
            </div>
          </div>
          <button
            type="button"
            aria-expanded={detailsOpen}
            aria-controls="tfh-details"
            onClick={(e) => { e.stopPropagation(); setDetailsOpen((v) => !v); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="mt-2 select-none inline-flex items-center gap-1 text-[12px] text-white/85 hover:text-white transition-colors"
            title={detailsOpen ? "Tap to collapse" : "Tap to expand"}
          >
            <span>{detailsOpen ? "Tap to collapse" : "Tap to expand"}</span>
            <svg suppressHydrationWarning xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={clsx("h-3.5 w-3.5 transition-transform duration-500", detailsOpen ? "rotate-180 opacity-70" : "rotate-0 opacity-60")}> 
              <path fillRule="evenodd" d="M12 14.5a.75.75 0 0 1-.53-.22l-5-5a.75.75 0 1 1 1.06-1.06L12 12.69l4.47-4.47a.75.75 0 1 1 1.06 1.06l-5 5a.75.75 0 0 1-.53.22z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {showPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowPhoto(false)} aria-hidden="true" />
          <div className="relative z-10 w-[92vw] max-w-3xl">
            <div className="bg-neutral-900/95 backdrop-blur p-2 sm:p-3 rounded-2xl border border-gray-700 shadow-2xl text-left select-none">
              <div
                className="relative"
                onPointerDown={(e) => { try { (e.currentTarget as any).setPointerCapture?.(e.pointerId); } catch {} (e.currentTarget as any)._sx = e.clientX; (e.currentTarget as any)._sy = e.clientY; (e.currentTarget as any)._dx = 0; (e.currentTarget as any)._dy = 0; }}
                onPointerMove={(e) => { const sx = (e.currentTarget as any)._sx; const sy = (e.currentTarget as any)._sy; if (sx == null || sy == null) return; const dx = e.clientX - sx; const dy = e.clientY - sy; (e.currentTarget as any)._dx = dx; (e.currentTarget as any)._dy = dy; e.currentTarget.style.transform = `translate(${dx}px, ${dy}px)`; e.currentTarget.style.transition = "none"; }}
                onPointerUp={(e) => { const dx = (e.currentTarget as any)._dx || 0; const dy = (e.currentTarget as any)._dy || 0; const abx = Math.abs(dx), aby = Math.abs(dy); e.currentTarget.style.transition = "transform 180ms ease"; e.currentTarget.style.transform = "translate(0,0)"; if (abx > 60 && abx > aby) { setPhotoIdx((i) => (dx > 0 ? (i > 0 ? i - 1 : gallery.length - 1) : (i + 1) % gallery.length)); } else if (aby > 80 && aby > abx) { setShowPhoto(false); } (e.currentTarget as any)._sx = null; (e.currentTarget as any)._sy = null; }}
                style={{ touchAction: "none" }}
              >
                {/^https?:\/\//.test(gallery[photoIdx]) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={gallery[photoIdx]} alt={`Photo of ${horse.name}`} className="rounded-lg w-full h-auto" loading="lazy" decoding="async" onError={(e) => { try { const img = e.currentTarget as HTMLImageElement; if (!img.src.includes("Tinder-for-Horses-cover-image")) { img.src = "/TFH/Tinder-for-Horses-cover-image.png"; } } catch {} }} />
                ) : (
                  <Image src={gallery[photoIdx]} alt={`Photo of ${horse.name}`} width={1200} height={800} className="rounded-lg w-full h-auto" placeholder="blur" blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=" onError={(e) => { try { const img = e.currentTarget as HTMLImageElement; if (!img.src.includes("Tinder-for-Horses-cover-image")) { img.src = "/TFH/Tinder-for-Horses-cover-image.png"; } } catch {} }} />
                )}
              </div>
              <div className="mt-3 flex justify-between gap-2">
                <button type="button" onClick={() => setShowPhoto(false)} className="rounded border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-700">Close</button>
                {gallery.length > 1 && (<div className="flex items-center gap-2"><button type="button" onClick={() => setPhotoIdx((i) => (i > 0 ? i - 1 : gallery.length - 1))} className="rounded border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-700">Prev</button><button type="button" onClick={() => setPhotoIdx((i) => (i + 1) % gallery.length)} className="rounded border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-700">Next</button></div>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {showActions && (
        <div className="grid grid-cols-2 gap-4 mt-2 mb-6">
          <button onClick={() => handleChoice(false)} className="rounded-full bg-red-600/90 hover:bg-red-600 text-white px-4 py-2 flex items-center justify-center gap-2" aria-label="Dislike" title="Dislike">
            <svg suppressHydrationWarning xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M6.225 4.811a.75.75 0 0 1 1.06 0L12 9.525l4.715-4.714a.75.75 0 1 1 1.06 1.06L13.06 10.586l4.715 4.714a.75.75 0 1 1-1.06 1.06L12 11.646l-4.715 4.714a.75.75 0 1 1-1.06-1.06l4.714-4.714-4.714-4.715a.75.75 0 0 1 0-1.06Z"/></svg>
            <span className="sr-only">Nope</span>
          </button>
          <button onClick={() => handleChoice(true)} className="rounded-full bg-green-600/90 hover:bg-green-600 text-white px-4 py-2 flex items-center justify-center gap-2" aria-label="Like" title="Like">
            <svg suppressHydrationWarning xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M11.645 20.91a.75.75 0 0 0 .71 0c1.2-.659 2.33-1.44 3.39-2.31 2.37-1.94 4.26-4.15 5.21-6.5.95-2.36.79-5.12-1.06-6.97-1.47-1.47-3.9-1.95-5.91-.21-.4.35-.76.77-1.08 1.25-.32-.48-.68-.9-1.08-1.25-2.01-1.74-4.44-1.26-5.91.21-1.85 1.85-2.01 4.61-1.06 6.97.95 2.35 2.84 4.56 5.21 6.5 1.06.87 2.2 1.65 3.39 2.31Z"/></svg>
            <span className="sr-only">Like</span>
          </button>
        </div>
      )}
    </div>
  );
}
