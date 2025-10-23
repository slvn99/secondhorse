import React from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import CollapsibleSidebar from "./_components/CollapsibleSidebar";
import MatchesSidebar from "./_components/MatchesSidebar";
import IntroOverlay from "./_components/IntroOverlay";
import Footer from "./_components/Footer";
import Toast from "./_components/Toast";
import CookieBanner from "./_components/CookieBanner";
import { getLastCommitDate, getShortCommit } from "@/lib/git";
import { TfhProvider } from "@/lib/tfh";
import styles from "./tinder-layout.module.css";
import { Analytics } from "@vercel/analytics/react";
import { resolveBaseUrl } from "./_lib/baseUrl";

const siteOrigin = resolveBaseUrl();

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const created = "2025-02-25"; // visible creation date label
  // Version/updated based on last commit; fall back to env or created
  const shortFromGit = getShortCommit();
  const dateFromGit = getLastCommitDate();
  const envSha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || process.env.COMMIT_SHA || "";
  const shortFromEnv = envSha ? String(envSha).slice(0, 7) : null;
  const version = shortFromGit ? `git-${shortFromGit}` : shortFromEnv ? `git-${shortFromEnv}` : "v0.1";
  const lastUpdated = dateFromGit || created;

  // Read one-time toast from cookie if present
  let toast: { type: "success" | "error" | "info"; message: string } | null = null;
  try {
    const ck = await cookies();
    const raw = ck.get("tfh_notice")?.value;
    if (raw) toast = JSON.parse(raw);
  } catch {}

  return (
    <html lang="en">
      <body>
        <TfhProvider>
          {toast && <Toast message={toast.message} type={(toast.type as any) || "info"} />}
          <CookieBanner />
          <div className={`relative flex h-[calc(100dvh-var(--footer-height,3rem))] overflow-hidden ${styles.scope}`}>
            <IntroOverlay />
            <MatchesSidebar />
            <div className="w-full flex-1 overflow-hidden h-full flex flex-col">
              <div className="px-3 pt-3">
                <div className="rounded-lg bg-gradient-to-r from-pink-600 via-yellow-400 to-pink-600 text-black text-center font-semibold tracking-wide px-4 py-2 shadow-lg"
                     role="status" aria-live="polite">
                  🚧 Work in Progress: crafted by Sam with Love & Laughter —
                  <a href="https://samvannoord.nl" target="_blank" rel="noopener noreferrer" className="ml-1 inline-block underline underline-offset-4 hover:opacity-90">
                    samvannoord.nl
                  </a>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                {children}
              </div>
            </div>
            <CollapsibleSidebar
        linkUrl="https://samvannoord.notion.site/2501089128d280dc8756faf0cc7c58f6?v=2501089128d28171bf7c000c1bdd27f9"
        hideMobileToggle
        description={
          <div className="space-y-3 text-neutral-300">
            <div className="inline-block bg-neutral-900/70 border border-neutral-800 rounded-xl px-3 py-3 backdrop-blur w-full">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span aria-hidden>🏇</span>
                Second Horse Dating
              </h2>
              <div className="mt-2 h-0.5 w-full rounded-full bg-gradient-to-r from-yellow-400 to-pink-500" />
              <p className="mt-2 text-neutral-200 text-xs italic">second horse dating - Saddle up!</p>
              <p className="mt-2 text-neutral-200 text-xs">
                Find your next riding companion by swiping through the profiles below.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href="/leaderboard" className="inline-flex items-center justify-center rounded-lg border border-neutral-700 bg-neutral-900/70 px-3 py-1.5 text-xs text-neutral-200 hover:border-neutral-600 hover:text-white">
                  View leaderboard
                </a>
              </div>
            </div>
            <p className="text-xs leading-relaxed">
              Second Horse Dating is a small demo. It&#39;s for me to fiddle around with AI code generation and the pipeline I&#39;ve created for it.
            </p>
            <p className="text-xs leading-relaxed">
              I use Codex Web and Codex CLI to see how much I can automate: creating files, matching styles, and making small, safe changes.
            </p>
            <p className="text-xs leading-relaxed">The goal is straightforward: create more amazing stuff in less time.</p>
            <p className="text-xs leading-relaxed">
              p.s. this application actually took a bit more time than just a few prompts to create. I haven&#39;t written any code myself, but I have spent days just prompting away, getting feature requests from friends and just creating something that I can actually be a bit proud of.
            </p>
            <hr className="my-3 border-neutral-800" />
            <p className="text-[11px] leading-relaxed text-neutral-400">
              This page was generated by AI to test my{' '}
              <a
                href="https://samvannoord.nl/hobby/2401089128d280fdb132f85545a47b0e/"
                className="underline hover:text-neutral-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                ultimate vibe code setup
              </a>
              . Created on {created}.
            </p>
            <p className="text-[11px] leading-relaxed text-neutral-400">
              <a href="/privacy" className="underline hover:text-neutral-200">Privacy note</a>
            </p>
            <p className="text-[11px] leading-relaxed text-neutral-400">
              <a href="/trademark-and-parody" className="underline hover:text-neutral-200">Trademark &amp; parody note</a>
            </p>
          </div>
        }
        footer={
          <div className="text-[11px] leading-relaxed text-neutral-400">
            <div>Version: {version}</div>
            <div>Last updated: {lastUpdated}</div>
          </div>
        }
          />
          </div>
          <Analytics />
          <Footer />
        </TfhProvider>
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  alternates: {
    canonical: "/",
  },
  title: {
    default: "Second Horse Dating",
    template: "%s | Second Horse Dating",
  },
  description:
    "Second Horse Dating - Saddle up! Swipe through horse profiles and find your perfect pasture partner.",
  keywords: [
    "second horse dating",
    "tinder for horses",
    "tinder-for-horses",
    "horse profiles",
    "equestrian",
    "swipe horses",
  ],
  openGraph: {
    type: "website",
    siteName: "Second Horse Dating",
    title: "Second Horse Dating",
    description:
      "Second Horse Dating - Saddle up! Swipe through horse profiles and find your perfect pasture partner.",
    images: [
      { url: `${siteOrigin}/TFH/tfh-og-image.png`, width: 1200, height: 630, alt: "Second Horse Dating - swipe horse profiles" },
    ],
    url: siteOrigin,
  },
  twitter: {
    card: "summary_large_image",
    title: "Second Horse Dating",
    description:
      "Second Horse Dating - Saddle up! Swipe through horse profiles and find your perfect pasture partner.",
    images: [`${siteOrigin}/TFH/tfh-og-image.png`],
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};
