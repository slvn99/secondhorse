"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "tfh_cookie_consent_v1";

export default function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  if (!open) return null;

  const accept = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ acceptedAt: Date.now() })); } catch {}
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-x-0 z-[950] px-3"
      style={{ bottom: "calc(var(--footer-height, 3rem) + 0.5rem)" }}
      role="dialog"
      aria-label="Cookie notice"
    >
      <div className="mx-auto max-w-3xl rounded-xl border border-neutral-800 bg-neutral-900/90 backdrop-blur px-3 py-3 text-neutral-100 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-xs sm:text-sm leading-relaxed">
            We use cookies for basic functionality and analytics to improve your experience.
            See our <Link href="/privacy" className="underline hover:text-white">privacy note</Link>.
          </p>
          <div className="flex items-center gap-2 sm:ml-auto">
            <button
              type="button"
              onClick={accept}
              className="inline-flex items-center justify-center rounded-md bg-yellow-500 text-black text-xs sm:text-sm font-medium px-3 py-1.5 hover:bg-yellow-400"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
