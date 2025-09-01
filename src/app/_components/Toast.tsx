"use client";

import { useEffect, useState } from "react";

export default function Toast({ message, type = "info" as const }: { message: string; type?: "success" | "error" | "info" }) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setOpen(false), 5000);
    return () => clearTimeout(t);
  }, []);
  if (!open) return null;
  const styles =
    type === "success"
      ? "bg-emerald-900/80 text-emerald-100 border-emerald-700"
      : type === "error"
      ? "bg-red-900/80 text-red-100 border-red-700"
      : "bg-neutral-800/90 text-neutral-100 border-neutral-700";
  return (
    <div className="fixed z-[2000] inset-x-0 top-2 px-3 flex justify-center pointer-events-none">
      <div className={`pointer-events-auto inline-flex items-start gap-3 rounded-lg border px-3 py-2 shadow-lg backdrop-blur ${styles}`}>
        <div className="text-sm max-w-[90vw] sm:max-w-md break-words">{message}</div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => setOpen(false)}
          className="ml-2 rounded border border-white/10 px-1.5 py-0.5 text-xs hover:bg-white/10"
        >
          Close
        </button>
      </div>
    </div>
  );
}

