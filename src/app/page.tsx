import Image from "next/image";
import type { Metadata } from "next";
import type { Horse } from "@/lib/horses";
import { horses as localHorses } from "@/lib/horses";
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

  async function loadHorsesFromDb(): Promise<Horse[]> {
  try {
    const url = process.env.DATABASE_URL;
    if (!url) return [];
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);

    type DbPhoto = { url?: string | null; is_primary?: boolean | null; position?: number | null };
    type DbRow = { id?: string; display_name?: string | null; bio?: string | null; age_years?: number | null; breed?: string | null; gender?: string | null; height_cm?: number | null; location_city?: string | null; location_country?: string | null; color?: string | null; temperament?: string | null; disciplines?: unknown; interests?: unknown; photos?: unknown; };

    const toTitle = (s?: string | null) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : undefined);
    const mapGender = (g?: string | null): Horse["gender"] => { const t = toTitle(g); return t === "Mare" || t === "Stallion" || t === "Gelding" ? (t as Horse["gender"]) : "Gelding"; };
    const mapRowToHorse = (r: DbRow): Horse => {
      const loc = [r.location_city, r.location_country].filter(Boolean).join(", ");
      const heightCm = r.height_cm ? Math.round(Number(r.height_cm)) : 150;
      const photos = Array.isArray(r.photos) ? (r.photos as DbPhoto[]) : [];
      const ordered = photos.slice().sort((a, b) => (Number(b?.is_primary) - Number(a?.is_primary)) || (Number(a?.position ?? 0) - Number(b?.position ?? 0)));
      const urls = ordered.map((p) => (p && p.url ? String(p.url) : null)).filter((u): u is string => !!u);
      const image = urls[0] || "/TFH/Tinder-for-Horses-cover-image.png";
      return { id: r.id, name: r.display_name || "Unknown", age: r.age_years ?? 5, breed: r.breed ?? "Unknown", location: loc || "Unknown", gender: mapGender(r.gender), heightCm, description: r.bio ?? "", color: r.color ?? "Bay", temperament: r.temperament ?? "Calm", disciplines: Array.isArray(r.disciplines) ? (r.disciplines as string[]) : [], interests: Array.isArray(r.interests) ? (r.interests as string[]) : [], image, photos: urls.length > 0 ? urls : undefined } satisfies Horse;
    };

    try {
      const rows = await sql`
        SELECT p.id, p.display_name, p.bio, p.age_years, p.breed, p.gender, p.height_cm,
               p.location_city, p.location_country, p.color, p.temperament, p.disciplines, p.interests,
               COALESCE((SELECT json_agg(json_build_object('url', ph.url, 'is_primary', ph.is_primary, 'position', ph.position) ORDER BY ph.is_primary DESC, ph.position ASC) FROM profile_photos ph WHERE ph.profile_id = p.id), '[]'::json) AS photos
        FROM profiles p
        WHERE COALESCE(p.is_active, TRUE) AND COALESCE(p.status, 'approved') <> 'rejected'
        ORDER BY p.id DESC
        LIMIT 100;`;
      return (rows as unknown as DbRow[]).map(mapRowToHorse);
    } catch {
      const rows = await sql`
        SELECT p.id, p.display_name, p.bio, p.age_years, p.breed, p.gender, p.height_cm,
               p.location_city, p.location_country, p.color, p.temperament, p.disciplines, p.interests,
               COALESCE((SELECT json_agg(json_build_object('url', ph.url, 'is_primary', ph.is_primary, 'position', ph.position) ORDER BY ph.is_primary DESC, ph.position ASC) FROM profile_photos ph WHERE ph.profile_id = p.id), '[]'::json) AS photos
        FROM profiles p
        ORDER BY p.id DESC
        LIMIT 100;`;
      return (rows as unknown as DbRow[]).map(mapRowToHorse);
    }
  } catch (e) {
    console.warn("Failed to load horses from DB:", e);
    return [];
  }
}

export default async function SecondHorsePage() {
  const dbHorses = await loadHorsesFromDb();
  const horses = dbHorses.length ? dbHorses : localHorses;
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
