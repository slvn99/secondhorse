import { cacheLife, cacheTag } from "next/cache";
import { neon } from "@neondatabase/serverless";
import { z } from "zod";
import type { Horse } from "@/lib/horses";

const photoSchema = z.object({
  url: z.string().trim().min(1).optional().nullable(),
  is_primary: z.union([z.boolean(), z.number(), z.string()]).optional().nullable(),
  position: z.union([z.number(), z.string()]).optional().nullable(),
});

const rowSchema = z.object({
  id: z.string().optional().nullable(),
  display_name: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  age_years: z.union([z.number(), z.string()]).optional().nullable(),
  breed: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  height_cm: z.union([z.number(), z.string()]).optional().nullable(),
  location_city: z.string().optional().nullable(),
  location_country: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  temperament: z.string().optional().nullable(),
  disciplines: z.any().optional().nullable(),
  interests: z.any().optional().nullable(),
  photos: z.any().optional().nullable(),
});

type ParsedRow = z.infer<typeof rowSchema>;

type NormalizedPhoto = {
  url: string;
  isPrimary: boolean;
  position: number;
};

function toTitleCase(input?: string | null) {
  if (!input) return "";
  const trimmed = input.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

function parseBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "yes";
  }
  return false;
}

function parseNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.round(parsed);
  }
  return fallback;
}

function coerceStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item == null) return "";
      return String(item).trim();
    })
    .filter((item) => item.length > 0);
}

function coercePhotos(value: unknown): NormalizedPhoto[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => photoSchema.safeParse(item))
    .filter((result): result is { success: true; data: z.infer<typeof photoSchema> } => result.success)
    .map((result) => {
      const data = result.data;
      const position = parseNumber(data.position ?? null, Number.MAX_SAFE_INTEGER);
      const url = typeof data.url === "string" ? data.url.trim() : "";
      return {
        url,
        isPrimary: parseBoolean(data.is_primary),
        position,
      } satisfies NormalizedPhoto;
    })
    .filter((photo) => photo.url.length > 0);
}

function mapRowToHorse(row: unknown): Horse {
  const parsed = rowSchema.parse(row) as ParsedRow;
  const photos = coercePhotos(parsed.photos);
  const ordered = photos
    .slice()
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.position - b.position);
  const urls = ordered.map((photo) => photo.url);
  const locationParts = [parsed.location_city, parsed.location_country]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter((part) => part.length > 0);
  const location = locationParts.join(", ");
  const genderTitle = toTitleCase(parsed.gender);
  const gender: Horse["gender"] =
    genderTitle === "Mare" || genderTitle === "Stallion" || genderTitle === "Gelding"
      ? (genderTitle as Horse["gender"])
      : "Gelding";

  const disciplines = coerceStringArray(parsed.disciplines);
  const interests = coerceStringArray(parsed.interests);

  const heightCm = parseNumber(parsed.height_cm, 150);
  const ageYears = parseNumber(parsed.age_years, 5);

  return {
    id: parsed.id ?? undefined,
    name: parsed.display_name?.trim() || "Unknown",
    age: ageYears,
    breed: parsed.breed?.trim() || "Unknown",
    location: location || "Unknown",
    gender,
    heightCm,
    description: parsed.bio ?? "",
    color: parsed.color?.trim() || "Bay",
    temperament: parsed.temperament?.trim() || "Calm",
    disciplines,
    interests,
    image: urls[0] || "/TFH/Tinder-for-Horses-cover-image.png",
    photos: urls.length > 0 ? urls : undefined,
  } satisfies Horse;
}

async function queryHorses(sql: ReturnType<typeof neon>, approvedOnly: boolean) {
  if (approvedOnly) {
    return (sql as any)`
      SELECT p.id, p.display_name, p.bio, p.age_years, p.breed, p.gender, p.height_cm,
             p.location_city, p.location_country, p.color, p.temperament, p.disciplines, p.interests,
             COALESCE((SELECT json_agg(json_build_object('url', ph.url, 'is_primary', ph.is_primary, 'position', ph.position)
                      ORDER BY ph.is_primary DESC, ph.position ASC)
                      FROM profile_photos ph WHERE ph.profile_id = p.id), '[]'::json) AS photos
      FROM profiles p
      WHERE COALESCE(p.is_active, TRUE) AND COALESCE(p.status, 'approved') <> 'rejected'
      ORDER BY p.id DESC
      LIMIT 100;
    `;
  }
  return (sql as any)`
    SELECT p.id, p.display_name, p.bio, p.age_years, p.breed, p.gender, p.height_cm,
           p.location_city, p.location_country, p.color, p.temperament, p.disciplines, p.interests,
           COALESCE((SELECT json_agg(json_build_object('url', ph.url, 'is_primary', ph.is_primary, 'position', ph.position)
                    ORDER BY ph.is_primary DESC, ph.position ASC)
                    FROM profile_photos ph WHERE ph.profile_id = p.id), '[]'::json) AS photos
    FROM profiles p
    ORDER BY p.id DESC
    LIMIT 100;
  `;
}

function mapRows(rows: unknown[]): Horse[] {
  return rows.map((row) => {
    try {
      return mapRowToHorse(row);
    } catch {
      return null;
    }
  }).filter((horse): horse is Horse => horse !== null);
}

export async function loadHorsesFromDb(databaseUrl = process.env.DATABASE_URL): Promise<Horse[]> {
  "use cache";
  cacheLife("horses");
  cacheTag("horses");
  if (!databaseUrl) return [];
  const sql = neon(databaseUrl);
  try {
    const rows = await queryHorses(sql, true);
    const mapped = mapRows(rows as unknown[]);
    if (mapped.length > 0) return mapped;
    const fallbackRows = await queryHorses(sql, false);
    return mapRows(fallbackRows as unknown[]);
  } catch (error) {
    console.warn("Primary horse query failed, retrying without filters:", error);
    try {
      const fallbackRows = await queryHorses(sql, false);
      return mapRows(fallbackRows as unknown[]);
    } catch (fallbackError) {
      console.warn("Failed to load horses from DB:", fallbackError);
      return [];
    }
  }
}

export function parseHorseRow(row: unknown): Horse {
  return mapRowToHorse(row);
}

export async function loadHorseFromDbById(
  id: string,
  databaseUrl = process.env.DATABASE_URL
): Promise<Horse | null> {
  "use cache";
  cacheLife("horses");
  cacheTag("horses");
  if (!databaseUrl) return null;
  const sql = neon(databaseUrl);
  try {
    const rows = await (sql as any)`
      SELECT p.id, p.display_name, p.bio, p.age_years, p.breed, p.gender, p.height_cm,
             p.location_city, p.location_country, p.color, p.temperament, p.disciplines, p.interests,
             COALESCE((SELECT json_agg(json_build_object('url', ph.url, 'is_primary', ph.is_primary, 'position', ph.position)
                      ORDER BY ph.is_primary DESC, ph.position ASC)
                      FROM profile_photos ph WHERE ph.profile_id = p.id), '[]'::json) AS photos
      FROM profiles p
      WHERE p.id = ${id}
      LIMIT 1;
    `;
    const mapped = mapRows(rows as unknown[]);
    return mapped[0] ?? null;
  } catch (error) {
    console.warn("Failed to load horse by id:", error);
    return null;
  }
}
