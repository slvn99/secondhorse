import type { Metadata } from "next";
import type { Horse } from "@/lib/horses";

export const defaultProfileMetadataBase: Metadata = {
  title: "Second Horse Dating",
  description:
    "Second Horse Dating - Saddle up! Swipe through horse profiles and find your perfect pasture partner.",
  openGraph: {
    title: "Second Horse Dating",
    description:
      "Second Horse Dating - Saddle up! Swipe through horse profiles and find your perfect pasture partner.",
    url: "/",
    siteName: "Second Horse Dating",
    images: [
      {
        url: "/TFH/tfh-og-image.png",
        width: 1200,
        height: 630,
        alt: "Second Horse Dating - swipe horse profiles",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Second Horse Dating",
    description:
      "Second Horse Dating - Saddle up! Swipe through horse profiles and find your perfect pasture partner.",
    images: ["/TFH/tfh-og-image.png"],
  },
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

type BuildProfileMetadataOptions = {
  baseMetadata: Metadata;
  horse: Horse;
  canonical?: string;
};

export function buildProfileMetadata({
  baseMetadata,
  horse,
  canonical,
}: BuildProfileMetadataOptions): Metadata {
  const fallbackDescription = baseMetadata.description ?? "";
  const defaultOgImages = baseMetadata.openGraph?.images ?? [];
  const baseTwitter =
    typeof baseMetadata.twitter === "object" ? baseMetadata.twitter : undefined;

  const title = `${horse.name} | Second Horse Dating`;

  const description = horse.description?.trim().length
    ? horse.description.trim()
    : fallbackDescription ||
      `Meet ${horse.name}, a ${horse.breed} from ${horse.location}.`;

  const primaryImage =
    horse.photos?.[0] ?? horse.image ?? defaultOgImages[0]?.url;
  const altText = `Second Horse Dating profile for ${horse.name}`;

  const keywords = Array.isArray(baseMetadata.keywords)
    ? Array.from(
        new Set(
          [
            ...baseMetadata.keywords,
            horse.name.toLowerCase(),
            horse.breed.toLowerCase(),
          ].filter(Boolean)
        )
      )
    : baseMetadata.keywords;

  return {
    ...baseMetadata,
    title,
    description,
    alternates: {
      ...baseMetadata.alternates,
      ...(canonical ? { canonical } : null),
    },
    openGraph: {
      ...baseMetadata.openGraph,
      title,
      description,
      url: canonical ?? baseMetadata.openGraph?.url,
      images: primaryImage
        ? [{ url: primaryImage, alt: altText }]
        : defaultOgImages,
    },
    twitter: {
      ...baseTwitter,
      card: baseTwitter?.card ?? "summary_large_image",
      title,
      description,
      images: primaryImage ? [primaryImage] : baseTwitter?.images,
    },
    keywords,
  };
}
