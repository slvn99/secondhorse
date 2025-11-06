'use client';

import Link from "next/link";
import { useEffect } from "react";

type ErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log on the client so we can inspect issues without exposing details to users.
    console.error("App error boundary captured an error:", error);
  }, [error]);

  return (
    <div className="relative min-h-[100dvh] bg-[#05060b] text-neutral-100">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.18),_transparent_60%)]"
      />
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-pink-500/40 bg-pink-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-pink-200">
          Second Horse Dating
        </div>
        <div
          className="space-y-6 rounded-3xl border border-white/10 bg-black/40 px-8 py-10 shadow-[0_20px_60px_rgba(12,4,24,0.45)] backdrop-blur"
          role="alert"
          aria-live="assertive"
        >
          <h1 className="text-3xl font-semibold sm:text-4xl">Hold your horses!</h1>
          <p className="text-sm leading-relaxed text-neutral-300 sm:text-base">
            Something bucked our servers off the trail. We’ve paused things to keep your data safe.
            Give it another try, and if the tumble keeps happening, head back to the pasture and we’ll take a closer look.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full rounded-full bg-gradient-to-r from-pink-500 via-amber-300 to-pink-500 px-6 py-3 text-sm font-semibold text-black transition hover:shadow-[0_0_25px_rgba(236,72,153,0.45)] sm:w-auto"
            >
              Try again
            </button>
            <Link
              href="/"
              className="w-full rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-neutral-100 transition hover:bg-white/10 sm:w-auto"
            >
              Back to homepage
            </Link>
          </div>
        </div>
        <p className="mt-6 text-xs text-neutral-500">
          Persistent issues? Send a note and include what you were doing when it happened.
        </p>
      </div>
    </div>
  );
}
