"use client";

import { useEffect, useState } from "react";

export default function CoachMarks() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem("tfh_tips_ok");
      if (!seen) setOpen(true);
    } catch {}
    const onShow = () => setOpen(true);
    window.addEventListener("tfh:show-tips", onShow as EventListener);
    return () => window.removeEventListener("tfh:show-tips", onShow as EventListener);
  }, []);

  if (!open) return null;

  const close = () => {
    try { localStorage.setItem("tfh_tips_ok", "1"); } catch {}
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-black/60" onClick={close} aria-hidden="true" />
      <div className="relative z-10 w-[92vw] max-w-lg">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/95 backdrop-blur p-4 text-neutral-100 shadow-2xl">
          <h2 className="text-lg font-semibold">Quick tips</h2>
          <ul className="mt-2 text-sm space-y-2 text-neutral-200">
            <li>Swipe right to like, left to nope.</li>
            <li>Use keyboard: ←/→ to swipe, Z to undo.</li>
            <li>Tap the photo to expand; swipe between photos; drag down to close.</li>
            <li>Top-right: share, undo, and enlarge.</li>
            <li>Filters live in the menu; tweak to widen your pasture.</li>
          </ul>
          <div className="mt-4 flex justify-end">
            <button onClick={close} className="rounded bg-yellow-500 text-black px-3 py-1.5 text-sm hover:bg-yellow-400">Got it</button>
          </div>
        </div>
      </div>
    </div>
  );
}

