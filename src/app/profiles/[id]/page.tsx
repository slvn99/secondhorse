import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProfileModal from "@/app/_components/ProfileModal";
import {
  defaultProfileMetadataBase,
  buildProfileMetadata,
} from "@/app/_lib/profileMetadata";
import {
  loadHorseForProfileKey,
  listSeedProfileParams,
} from "@/lib/profileLookup";

type ProfilePageParams = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  const seeds = listSeedProfileParams();
  return seeds.map((identifier) => ({ id: identifier.id }));
}

export async function generateMetadata(
  props: ProfilePageParams
): Promise<Metadata> {
  const { id } = await props.params;
  const { horse, identifier } = await loadHorseForProfileKey(id);

  if (!horse || !identifier) {
    return defaultProfileMetadataBase;
  }

  const canonicalPath = `/profiles/${identifier.id}`;

  return buildProfileMetadata({
    baseMetadata: defaultProfileMetadataBase,
    horse,
    canonical: canonicalPath,
  });
}

export default async function ProfilePage({ params }: ProfilePageParams) {
  const { id } = await params;
  const { horse, identifier } = await loadHorseForProfileKey(id);

  if (!horse || !identifier) {
    notFound();
  }

  return (
    <div className="relative h-full w-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-neutral-400">
              Horse Profile
            </p>
            <h1 className="text-3xl font-semibold text-white">
              {horse.name}
            </h1>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded border border-neutral-700 bg-neutral-900/80 px-3 py-1.5 text-sm text-neutral-200 transition hover:border-neutral-600 hover:text-white"
          >
            <span aria-hidden>{"\u2190"}</span> Back to browsing
          </Link>
        </div>
        <ProfileModal
          horse={horse}
          externalIdentifier={identifier}
          variant="standalone"
        />
      </div>
    </div>
  );
}
