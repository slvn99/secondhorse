"use client";
import { useRef, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function IntroOverlay() {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const [fading, setFading] = useState(false);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const moved = useRef(false);

  const dismiss = () => {
    setFading(true);
    // Delay unmount to allow fade-out animation
    setTimeout(() => setOpen(false), 400);
    try {
      localStorage.setItem("tfh_intro_seen_at", String(Date.now()));
    } catch {}
  };

  // Show only once per hour
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tfh_intro_seen_at");
      const last = raw ? Number(raw) : 0;
      const hour = 60 * 60 * 1000;
      if (last && Date.now() - last < hour) {
        setOpen(false);
      }
    } catch {}
  }, []);

  const disabled = !!(pathname && pathname.startsWith("/new"));
  if (disabled || !open) return null;

  return (
    <div
      className={`absolute inset-0 z-[2000] overflow-hidden cursor-pointer bg-black/70 transition-opacity duration-500 ease-out ${
        fading ? "opacity-0" : "opacity-100"
      }`}
      onClick={dismiss}
      onPointerDown={(e) => {
        startX.current = e.clientX;
        startY.current = e.clientY;
        moved.current = false;
        try { (e.currentTarget as any).setPointerCapture?.(e.pointerId); } catch {}
      }}
      onPointerMove={(e) => {
        if (startX.current === null || startY.current === null) return;
        const dx = e.clientX - startX.current;
        const dy = e.clientY - startY.current;
        if (Math.hypot(dx, dy) > 30) moved.current = true;
      }}
      onPointerUp={() => {
        if (moved.current) dismiss();
      }}
      role="button"
      aria-label="Close intro"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === "Escape" || e.key === " ") dismiss();
      }}
    >
      <Image
        src="/TFH/Tinder-for-Horses-cover-image.png"
        alt="Tinder for Horses cover"
        fill
        priority
        className="object-contain select-none pointer-events-none"
      />
      <div className="absolute inset-0 flex items-start justify-center p-6">
        <div className="text-center mt-6">
          <p className="mt-0 text-neutral-200 text-xs inline-block bg-neutral-800/70 px-2 py-1 rounded">Tap, click, or swipe to continue</p>
        </div>
      </div>
    </div>
  );
}
