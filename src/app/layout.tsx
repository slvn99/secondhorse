import React from "react";
import "./globals.css";
import CollapsibleSidebar from "./_components/CollapsibleSidebar";
import MatchesSidebar from "./_components/MatchesSidebar";
import IntroOverlay from "./_components/IntroOverlay";
import styles from "./tinder-layout.module.css";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const created = "2025-02-25"; // visible creation date label
  const version = "v0.1";
  const lastUpdated = created;

  return (
    <html lang="en">
      <body>
        <div className={`relative flex h-[calc(100svh-var(--nav-height,3rem)-var(--footer-height,3rem))] overflow-hidden ${styles.scope}`}>
          <IntroOverlay />
          <MatchesSidebar />
          <div className="w-full flex-1 overflow-hidden h-[calc(100dvh-var(--nav-height,3rem))]">{children}</div>
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
              <p className="mt-2 text-neutral-200 text-xs">
                Swipe through horse profiles and find your perfect pasture partner.
              </p>
            </div>
            <p className="text-xs leading-relaxed">
              A lighthearted parody demo exploring AI-assisted code workflows. You may see the tagline “tinder for horses” in copy, but the app name is Second Horse Dating.
            </p>
            <p className="text-xs leading-relaxed">
              Built with Next.js App Router and Tailwind, focusing on fast iteration and playful UX.
            </p>
            <hr className="my-3 border-neutral-800" />
            <p className="text-[11px] leading-relaxed text-neutral-400">
              This page was generated with AI as part of an experimentation pipeline. Created on {created}. Read more about the {" "}
              <a href="https://samvannoord.nl/hobby/2401089128d280fdb132f85545a47b0e/" className="underline hover:text-neutral-200" target="_blank" rel="noopener noreferrer">
                ultimate vibe code setup
              </a>.
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
      </body>
    </html>
  );
}
