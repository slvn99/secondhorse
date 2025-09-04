import { z } from "zod";

export const profileSchema = z.object({
  display_name: z.string().min(1).max(120),
  bio: z.string().max(1000).optional().default(""),
  age_years: z.coerce.number().int().min(0).max(40).optional().nullable(),
  breed: z.string().max(120).optional().nullable(),
  gender: z.enum(["mare", "stallion", "gelding", "unknown"]).optional().nullable(),
  height_cm: z.coerce.number().int().min(50).max(230).optional().nullable(),
  location_city: z.string().max(120).optional().nullable(),
  location_country: z.string().max(120).optional().nullable(),
  color: z.string().max(64).optional().nullable(),
  temperament: z.string().max(64).optional().nullable(),
  disciplines: z.string().optional().nullable(),
  interests: z.string().optional().nullable(),
});

function normalizeEmpty(v: unknown): undefined | unknown {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "string" && v.trim() === "") return undefined;
  return v;
}

export type ProfileParsed = z.infer<typeof profileSchema>;

export function normalizeAndParse(input: Record<string, unknown>): ProfileParsed {
  const fields: Record<string, unknown> = { ...input };
  // Normalize empty strings to undefined for optional numeric/text fields
  fields.age_years = normalizeEmpty(fields.age_years);
  fields.height_cm = normalizeEmpty(fields.height_cm);
  const g = typeof fields.gender === "string" ? fields.gender.toLowerCase() : fields.gender;
  fields.gender = normalizeEmpty(g);
  fields.disciplines = normalizeEmpty(fields.disciplines) ?? "";
  fields.interests = normalizeEmpty(fields.interests) ?? "";
  return profileSchema.parse(fields);
}

