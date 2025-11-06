import { neon } from "@neondatabase/serverless";
import type { Metadata } from "next";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import Script from "next/script";
import { saveImageAndGetUrl } from "../_lib/uploads";
import { rateLimit } from "../_lib/rateLimit";
import { normalizeAndParse } from "./validation";
import NewFormClient from "./NewFormClient";

export const metadata: Metadata = {
  title: "Add Horse Profile",
  description: "Create a new horse profile with photos.",
  openGraph: {
    title: "Add Horse Profile – Second Horse Dating",
    description: "Create a new horse profile with photos.",
    images: [
      { url: "/TFH/tfh-og-image.png", width: 1200, height: 630, alt: "Second Horse Dating – add horse profile" },
    ],
    url: "/new",
  },
  twitter: {
    card: "summary_large_image",
    title: "Add Horse Profile – Second Horse Dating",
    description: "Create a new horse profile with photos.",
    images: ["/TFH/tfh-og-image.png"],
  },
  alternates: { canonical: "/new" },
};

export const dynamic = "force-dynamic";

function sanitizeText(v: unknown, max = 500): string {
  let s = typeof v === "string" ? v : String(v ?? "");
  s = s.normalize("NFC").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "").trim();
  if (s.length > max) s = s.slice(0, max);
  return s;
}

function getField(formData: FormData, name: string): FormDataEntryValue | null {
  const direct = formData.get(name);
  if (direct !== null) return direct;
  for (const [k, v] of formData.entries()) {
    const normalized = String(k).replace(/^\d+_/, "");
    if (normalized === name) return v;
  }
  return null;
}

function parseCsvArray(v: unknown, maxItems = 12, maxLen = 48): string[] {
  if (!v) return [];
  const s = String(v);
  const arr = s.split(",").map((x) => sanitizeText(x, maxLen)).filter((x) => x.length > 0);
  return Array.from(new Set(arr)).slice(0, maxItems);
}

async function allowedHost(h: Headers): Promise<boolean> {
  const origin = h.get("origin");
  const referer = h.get("referer");
  const host = (h.get("host") || "").toLowerCase();
  const envAllow = (process.env.ALLOWED_HOSTS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const allowedHosts = envAllow.length > 0 ? envAllow : [host];
  const hostFrom = (urlStr?: string | null) => { if (!urlStr) return undefined; try { return new URL(urlStr).host.toLowerCase(); } catch { return undefined; } };
  const originHost = hostFrom(origin);
  const refererHost = hostFrom(referer);
  return !!((originHost && allowedHosts.includes(originHost)) || (refererHost && allowedHosts.includes(refererHost)) || (host && allowedHosts.includes(host)));
}

async function create(formData: FormData) {
  "use server";
  const hdrs = await headers();
  const isProd = process.env.NODE_ENV === "production";
  const setNotice = async (type: "success" | "error" | "info", message: string, maxAge = 60) => {
    const store = await cookies();
    store.set("tfh_notice", JSON.stringify({ type, message }), { path: "/", maxAge, httpOnly: true, sameSite: "strict", secure: isProd });
  };
  // Basic rate limit by IP to reduce abuse
  const xffAll = hdrs.get("x-forwarded-for") || "";
  const ipGuess = (xffAll.split(",")[0].trim() || hdrs.get("x-real-ip") || hdrs.get("fly-client-ip") || hdrs.get("cf-connecting-ip") || "unknown").toString();
  const rl = rateLimit(`new:${ipGuess}`);
  if (!rl.allowed) {
    await setNotice("error", "Too many requests. Please try again in a minute.", 20);
    redirect("/new");
  }
  const ok = await allowedHost(hdrs as unknown as Headers);
  if (!ok) {
    await setNotice("error", "Request origin not allowed.", 20);
    redirect("/");
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    const namePreview = sanitizeText(getField(formData, "display_name"), 120) || "Profile";
    await setNotice("success", `Saved \"${namePreview}\" (no database configured).`, 20);
    redirect("/");
  }
  const sql = neon(url);

  try {
    const secret = process.env.HCAPTCHA_SECRET;
    if (process.env.NODE_ENV === "production" && secret) {
      const token = formData.get("h-captcha-response");
      if (!token || typeof token !== "string") {
        await setNotice("error", "Captcha verification failed. Please try again.", 30);
        redirect("/new");
      }
      const xff = (await headers()).get("x-forwarded-for") || "";
      const ip = xff.split(",")[0].trim();
      const body = new URLSearchParams({ secret: secret!, response: token as string });
      if (ip) body.set("remoteip", ip);
      const resp = await fetch("https://hcaptcha.com/siteverify", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body, cache: "no-store" });
      const data = (await resp.json()) as { success?: boolean };
      if (!data?.success) {
        await setNotice("error", "Captcha check failed. Please try again.", 30);
        redirect("/new");
      }
    }
  } catch {}

  // Validate and coerce input with zod
  const raw = {
    display_name: sanitizeText(getField(formData, "display_name"), 120),
    bio: sanitizeText(getField(formData, "bio"), 1000),
    age_years: getField(formData, "age_years"),
    breed: sanitizeText(getField(formData, "breed"), 120) || null,
    gender: sanitizeText(getField(formData, "gender"), 20) || null,
    height_cm: getField(formData, "height_cm"),
    location_city: sanitizeText(getField(formData, "location_city"), 120) || null,
    location_country: sanitizeText(getField(formData, "location_country"), 120) || null,
    color: sanitizeText(getField(formData, "color"), 64) || null,
    temperament: sanitizeText(getField(formData, "temperament"), 64) || null,
    disciplines: sanitizeText(getField(formData, "disciplines"), 500) || "",
    interests: sanitizeText(getField(formData, "interests"), 500) || "",
  } as any;
  let parsed: ReturnType<typeof normalizeAndParse>;
  try {
    parsed = normalizeAndParse(raw);
  } catch {
    await setNotice("error", "Please check your input and try again.", 20);
    redirect("/new");
  }

  const display_name = parsed!.display_name;
  const bio = parsed!.bio || null;
  const age = parsed!.age_years ?? null;
  const breed = parsed!.breed || null;
  const gender = parsed!.gender || null;
  const height_cm = parsed!.height_cm ?? null;
  const location_city = parsed!.location_city || null;
  const location_country = parsed!.location_country || null;
  const color = parsed!.color || null;
  const temperament = parsed!.temperament || null;
  const disciplines = parseCsvArray(parsed!.disciplines, 12, 48);
  const interests = parseCsvArray(parsed!.interests, 12, 48);

  const photos: { url: string; position: number; is_primary: boolean }[] = [];
  let attemptedFileUpload = false;
  let fileUploadFailed = false;
  const primaryIndex = Number(getField(formData, "primary_photo") || "");
  for (let i = 0; i < 4; i++) {
    const posRaw = Number(getField(formData, `photo_${i}_pos`) || "");
    const position = Number.isFinite(posRaw) && posRaw > 0 ? Math.floor(posRaw) : i + 1;
    let chosenUrl = "";
    const maybeFile = getField(formData, `photo_file_${i}`);
    if (maybeFile && typeof maybeFile === "object" && "arrayBuffer" in maybeFile) {
      const file = maybeFile as unknown as File;
      if (file && (file as File).size > 0) {
        attemptedFileUpload = true;
        try { chosenUrl = await saveImageAndGetUrl(file); } catch { fileUploadFailed = true; }
      }
    }
    if (!chosenUrl) {
      const urlField = sanitizeText(getField(formData, `photo_${i}`), 1000);
      if (urlField) chosenUrl = urlField;
    }
    if (chosenUrl) { photos.push({ url: chosenUrl, position, is_primary: primaryIndex === i }); }
  }
  // Deduplicate and normalize photos
  if (photos.length) {
    const seen = new Set<string>();
    const dedup = photos.filter((p) => (p.url && !seen.has(p.url) ? (seen.add(p.url), true) : false));
    dedup.sort((a,b)=>a.position-b.position);
    dedup.forEach((p,i)=>{ p.position = i+1; });
    if (!dedup.some((p)=>p.is_primary)) dedup[0].is_primary = true;
    photos.length = 0; photos.push(...dedup);
  }

  try {
    let id: string;
    try {
      const rows = await sql`
        INSERT INTO profiles (
          display_name, bio, age_years, breed, gender, height_cm,
          location_city, location_country, color, temperament, disciplines, interests,
          is_active, status
        ) VALUES (
          ${display_name}, ${bio}, ${age}, ${breed}, ${gender}, ${height_cm},
          ${location_city}, ${location_country}, ${color}, ${temperament}, ${disciplines}::text[], ${interests}::text[],
          FALSE, 'pending'
        )
        RETURNING id;`;
      id = (rows as any)[0]?.id as string;
    } catch {
      try {
        const rows = await sql`
          INSERT INTO profiles (
            display_name, bio, age_years, breed, gender, height_cm,
            location_city, location_country, color, temperament, disciplines, interests,
            is_active
          ) VALUES (
            ${display_name}, ${bio}, ${age}, ${breed}, ${gender}, ${height_cm},
            ${location_city}, ${location_country}, ${color}, ${temperament}, ${disciplines}::text[], ${interests}::text[],
            FALSE
          )
          RETURNING id;`;
        id = (rows as any)[0]?.id as string;
      } catch {
        const rows = await sql`
          INSERT INTO profiles (
            display_name, bio, age_years, breed, gender, height_cm,
            location_city, location_country, color, temperament, disciplines, interests
          ) VALUES (
            ${display_name}, ${bio}, ${age}, ${breed}, ${gender}, ${height_cm},
            ${location_city}, ${location_country}, ${color}, ${temperament}, ${disciplines}::text[], ${interests}::text[]
          )
          RETURNING id;`;
        id = (rows as any)[0]?.id as string;
      }
    }

    if (photos.length) {
      try {
        photos.sort((a, b) => a.position - b.position);
        let primarySet = false;
        for (const p of photos) {
          const is_primary = !primarySet && p.is_primary; if (is_primary) primarySet = true;
          await sql`INSERT INTO profile_photos (profile_id, url, position, is_primary) VALUES (${id}, ${p.url}, ${p.position}, ${is_primary})`;
        }
      } catch {}
    }

    revalidateTag("horses", "max");
    revalidateTag("leaderboard", "max");

    await setNotice("success", `Profile \"${display_name}\" created.${attemptedFileUpload && fileUploadFailed ? ' (image upload unavailable)' : ''}`);
    redirect("/");
  } catch (e) {
    const dig = (e as any)?.digest as string | undefined;
    if (typeof dig === "string" && dig.startsWith("NEXT_REDIRECT")) throw e;
    await setNotice("error", "Failed to create profile. Please try again.");
    redirect("/");
  }
}

export default async function NewProfilePage() {
  const store = await cookies();
  let notice: { type: "success" | "error" | "info"; message: string } | undefined;
  try { const raw = store.get("tfh_notice")?.value; if (raw) notice = JSON.parse(raw); } catch {}
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 pb-[calc(var(--footer-height,3rem)+2rem)]">
        <Script src="https://js.hcaptcha.com/1/api.js" async defer />
        <NewFormClient action={create} notice={notice} />
      </div>
    </div>
  );
}
