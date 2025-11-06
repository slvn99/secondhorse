import Image from "next/image";
import type { Metadata } from "next";
import { horses as localHorses } from "@/lib/horses";
import { loadHorsesFromDb } from "@/lib/horseSource";
import { loadFeatureFlagsForRuntime } from "@/lib/brokenFeatureFlags";
import TfhClient from "./_components/TfhClient";

export const metadata: Metadata = {
  title: "Second Horse Dating",
  description: "Second Horse Dating – Saddle up! Swipe through horse profiles and find your perfect pasture partner.",
  openGraph: {
    title: "Second Horse Dating",
    description: "Second Horse Dating – Saddle up! Swipe through horse profiles and find your perfect pasture partner.",
    url: "/",
    siteName: "Second Horse Dating",
    images: [ { url: "/TFH/tfh-og-image.png", width: 1200, height: 630, alt: "Second Horse Dating – swipe horse profiles" } ],
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Second Horse Dating", description: "Second Horse Dating – Saddle up! Swipe through horse profiles and find your perfect pasture partner.", images: ["/TFH/tfh-og-image.png"] },
  alternates: { canonical: "/" },
  keywords: [
    "second horse dating",
    "tinder for horses",
    "tinder-for-horses",
    "horse profiles",
    "equestrian",
    "swipe horses",
  ],
};

export const revalidate = 60; // revalidate page every 60s

export default async function SecondHorsePage() {
  const flags = loadFeatureFlagsForRuntime();
  const preferDatabase =
    typeof flags["preferDatabase"] === "boolean" ? (flags["preferDatabase"] as boolean) : true;
  const dbHorses = await loadHorsesFromDb();
  const horses = preferDatabase && dbHorses.length ? dbHorses : localHorses;
  return (
    <div className="relative w-full h-full">
      {/* Fixed background layer to keep visuals consistent across mobile/desktop */}
      <div className="fixed inset-0 -z-10">
        <Image src="/TFH/Tinder-for-Horses-background.png" alt="Second Horse Dating background" fill className="object-cover" priority suppressHydrationWarning sizes="100vw" />
        <div className="absolute inset-0 bg-black/50" />
      </div>
      {/* Foreground content scrolls independently */}
      <div className="relative z-10 h-full w-full text-white overflow-hidden">
        <div className="h-full w-full overflow-y-auto">
          <TfhClient horses={horses} />
        </div>
      </div>
    </div>
  );
}
