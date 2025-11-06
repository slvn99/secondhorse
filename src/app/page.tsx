import Image from "next/image";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { horses as localHorses } from "@/lib/horses";
import { loadHorsesFromDb } from "@/lib/horseSource";
import { loadFeatureFlagsForRuntime } from "@/lib/brokenFeatureFlags";
import { loadHorseForProfileKey } from "@/lib/profileLookup";
import {
  defaultProfileMetadataBase,
  buildProfileMetadata,
} from "@/app/_lib/profileMetadata";
import TfhClient from "./_components/TfhClient";

export const defaultHomeMetadata = defaultProfileMetadataBase;

type HomePageSearchParams = {
  id?: string | string[];
  profile?: string | string[];
  p?: string | string[];
};

function firstParam(value?: string | string[] | null): string | null {
  if (!value) return null;
  const raw = Array.isArray(value) ? value.find(Boolean) ?? null : value;
  if (!raw) return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function generateMetadata(
  props: { searchParams: HomePageSearchParams | Promise<HomePageSearchParams> }
): Promise<Metadata> {
  const resolved =
    typeof (props.searchParams as any)?.then === "function"
      ? await (props.searchParams as Promise<HomePageSearchParams>)
      : (props.searchParams as HomePageSearchParams);

  const rawProfile = firstParam(resolved?.profile);
  const rawId = firstParam(resolved?.id);
  const rawName = firstParam(resolved?.p);

  const candidates = [rawProfile, rawId, rawName];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const { horse } = await loadHorseForProfileKey(candidate);
    if (horse) {
      return buildProfileMetadata({
        baseMetadata: defaultHomeMetadata,
        horse,
        canonical: "/",
      });
    }
  }

  return defaultHomeMetadata;
}

export default async function SecondHorsePage({
  searchParams,
}: {
  searchParams?: HomePageSearchParams | Promise<HomePageSearchParams>;
}) {
  const resolvedSearchParams =
    typeof (searchParams as any)?.then === "function"
      ? await (searchParams as Promise<HomePageSearchParams>)
      : (searchParams as HomePageSearchParams | undefined) ?? {};

  const rawId = firstParam(resolvedSearchParams.id);
  const rawName = firstParam(resolvedSearchParams.p);

  const legacyTarget = rawId ?? rawName;
  if (legacyTarget) {
    const { identifier } = await loadHorseForProfileKey(legacyTarget);
    if (identifier) {
      redirect(`/profiles/${identifier.id}`);
    }
  }

  const flags = loadFeatureFlagsForRuntime();
  const preferDatabaseFlag = flags?.["preferDatabase"];
  const preferDatabase =
    typeof preferDatabaseFlag === "boolean" ? preferDatabaseFlag : true;
  const dbHorses = await loadHorsesFromDb();
  const horses = preferDatabase && dbHorses.length ? dbHorses : localHorses;
  return (
    <div className="relative w-full h-full">
      {/* Fixed background layer to keep visuals consistent across mobile/desktop */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="/TFH/Tinder-for-Horses-background.png"
          alt="Second Horse Dating background"
          fill
          className="object-cover"
          priority
          suppressHydrationWarning
          sizes="100vw"
        />
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
