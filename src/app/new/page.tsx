import { neon } from "@neondatabase/serverless";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import Script from "next/script";
import { saveImageAndGetUrl } from "../_lib/uploads";
import NewFormClient from "./NewFormClient";

export const metadata: Metadata = { title: "Add Horse Profile – Second Horse Dating", description: "Create a new horse profile with photos." };

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

export async function create(formData: FormData) {
  "use server";
  const hdrs = await headers();
  const ok = await allowedHost(hdrs as unknown as Headers);
  if (!ok) {
    const store = await cookies();
    const secure = process.env.NODE_ENV === "production";
    store.set("tfh_notice", JSON.stringify({ type: "error", message: "Request origin not allowed." }), { path: "/", maxAge: 20, httpOnly: true, sameSite: "strict", secure });
    redirect("/");
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    const namePreview = sanitizeText(getField(formData, "display_name"), 120) || "Profile";
    const store = await cookies();
    const secure = process.env.NODE_ENV === "production";
    store.set("tfh_notice", JSON.stringify({ type: "success", message: `Saved \"${namePreview}\" (no database configured).` }), { path: "/", maxAge: 20, httpOnly: true, sameSite: "strict", secure });
    redirect("/");
  }
  const sql = neon(url);

  try {
    const secret = process.env.HCAPTCHA_SECRET;
    if (process.env.NODE_ENV === "production" && secret) {
      const token = formData.get("h-captcha-response");
      if (!token || typeof token !== "string") {
        const store = await cookies();
        store.set("tfh_notice", JSON.stringify({ type: "error", message: "Captcha verification failed. Please try again." }), { path: "/", maxAge: 30, httpOnly: true, sameSite: "strict", secure: true });
        redirect("/new");
      }
      const xff = (await headers()).get("x-forwarded-for") || "";
      const ip = xff.split(",")[0].trim();
      const body = new URLSearchParams({ secret: secret!, response: token as string });
      if (ip) body.set("remoteip", ip);
      const resp = await fetch("https://hcaptcha.com/siteverify", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body, cache: "no-store" });
      const data = (await resp.json()) as { success?: boolean };
      if (!data?.success) {
        const store = await cookies();
        store.set("tfh_notice", JSON.stringify({ type: "error", message: "Captcha check failed. Please try again." }), { path: "/", maxAge: 30, httpOnly: true, sameSite: "strict", secure: true });
        redirect("/new");
      }
    }
  } catch {}

  const display_name = sanitizeText(getField(formData, "display_name"), 120);
  if (!display_name) {
    const store = await cookies();
    const secure = process.env.NODE_ENV === "production";
    store.set("tfh_notice", JSON.stringify({ type: "error", message: "Display name is required." }), { path: "/", maxAge: 20, httpOnly: true, sameSite: "strict", secure });
    redirect("/new");
  }

  const bio = sanitizeText(getField(formData, "bio"), 1000) || null;
  const age_years = Number(getField(formData, "age_years") || "");
  const age = Number.isFinite(age_years) ? age_years : null;
  const breed = sanitizeText(getField(formData, "breed"), 120) || null;
  const genderRaw = String(getField(formData, "gender") || "").toLowerCase();
  const gender: string | null = ["mare", "stallion", "gelding", "unknown"].includes(genderRaw) ? genderRaw : null;
  const height_cm_raw = Number(getField(formData, "height_cm") || "");
  const height_cm = Number.isFinite(height_cm_raw) && height_cm_raw >= 50 && height_cm_raw <= 230 ? Math.round(height_cm_raw) : null;
  const location_city = sanitizeText(getField(formData, "location_city"), 120) || null;
  const location_country = sanitizeText(getField(formData, "location_country"), 120) || null;
  const color = sanitizeText(getField(formData, "color"), 64) || null;
  const temperament = sanitizeText(getField(formData, "temperament"), 64) || null;
  const disciplines = parseCsvArray(getField(formData, "disciplines"));
  const interests = parseCsvArray(getField(formData, "interests"));

  const photos: { url: string; position: number; is_primary: boolean }[] = [];
  let attemptedFileUpload = false;
  let fileUploadFailed = false;
  const primaryIndex = Number(getField(formData, "primary_photo") || "");
  for (let i = 0; i < 5; i++) {
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
  if (photos.length && !photos.some((p) => p.is_primary)) { photos[0].is_primary = true; }

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

    const store = await cookies();
    const secure = process.env.NODE_ENV === "production";
    store.set("tfh_notice", JSON.stringify({ type: "success", message: `Profile \"${display_name}\" created.${attemptedFileUpload && fileUploadFailed ? ' (image upload unavailable)' : ''}` }), { path: "/", maxAge: 60, httpOnly: true, sameSite: "strict", secure });
    redirect("/");
  } catch (e) {
    const dig = (e as any)?.digest as string | undefined;
    if (typeof dig === "string" && dig.startsWith("NEXT_REDIRECT")) throw e;
    const store = await cookies();
    const secure = process.env.NODE_ENV === "production";
    store.set("tfh_notice", JSON.stringify({ type: "error", message: "Failed to create profile. Please try again." }), { path: "/", maxAge: 60, httpOnly: true, sameSite: "strict", secure });
    redirect("/");
  }
}

export default async function NewProfilePage() {
  const store = await cookies();
  let notice: { type: "success" | "error"; message: string } | undefined;
  try { const raw = store.get("tfh_notice")?.value; if (raw) notice = JSON.parse(raw); } catch {}
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 pb-[calc(var(--footer-height,3rem)+2rem)]">
        <Script src="https://js.hcaptcha.com/1/api.js" async defer />
        <NewFormClient />
        <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-neutral-950/85 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/60 border-b border-neutral-800/60">
          <div className="mx-auto max-w-3xl flex items-center justify-between gap-3">
            <h1 className="text-xl sm:text-2xl font-semibold">Add Horse Profile</h1>
            <div className="flex items-center gap-2">
              <Link href="/" className="px-3 py-1.5 rounded border border-neutral-700 text-neutral-200 hover:bg-neutral-800 text-sm">Cancel</Link>
              <button type="submit" form="tfh-new-form" id="tfh-save-btn" className="px-3 py-1.5 rounded bg-yellow-500 text-black text-sm font-medium hover:bg-yellow-400 disabled:opacity-60 disabled:cursor-not-allowed">
                <span className="inline-flex items-center gap-2">
                  <svg className="hidden animate-spin h-4 w-4" data-spinner aria-hidden viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a12 12 0 00-12 12h4z"></path></svg>
                  <span data-label>Save</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        <form id="tfh-new-form" action={create} className="space-y-6 mt-6">
          {notice && notice.type === "error" && (<div className="rounded border border-red-800 bg-red-900/40 text-red-200 px-3 py-2 text-sm">{notice.message}</div>)}
          <div id="tfh-form-error" className="hidden rounded border border-red-800 bg-red-900/40 text-red-200 px-3 py-2 text-sm"></div>
          <p className="text-sm text-neutral-400">Fields marked with <span className="text-yellow-400">*</span> are required. Others are optional.</p>

          <div className="rounded-2xl border border-yellow-700/50 bg-yellow-900/10 p-4">
            <h2 className="text-lg font-semibold text-neutral-200">Basic Info</h2>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-sm text-neutral-300">Display name <span className="text-yellow-400">*</span><input name="display_name" required maxLength={120} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 text-neutral-100 px-3 py-2" /></label>
              <label className="text-sm text-neutral-300">Breed<input name="breed" maxLength={120} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 text-neutral-100 px-3 py-2" /></label>
              <label className="text-sm text-neutral-300">Gender<select name="gender" className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 text-neutral-100 px-3 py-2"><option value="mare">Mare</option><option value="stallion">Stallion</option><option value="gelding">Gelding</option><option value="unknown">Prefer not to say</option></select></label>
              <label className="text-sm text-neutral-300">Age (years)<input type="number" name="age_years" min={0} max={40} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 text-neutral-100 px-3 py-2" /></label>
              <label className="text-sm text-neutral-300">Height (cm)<input type="number" name="height_cm" min={50} max={230} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 text-neutral-100 px-3 py-2" /></label>
              <label className="text-sm text-neutral-300">Color<input name="color" maxLength={64} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 text-neutral-100 px-3 py-2" /></label>
            </div>
            <label className="block mt-3 text-sm text-neutral-300">Bio<textarea name="bio" rows={4} maxLength={1000} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 text-neutral-100 px-3 py-2" /></label>
          </div>

          <div className="rounded-2xl border border-blue-700/40 bg-blue-900/10 p-4">
            <h2 className="text-lg font-semibold text-neutral-200">Location</h2>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-sm text-neutral-300">City<input name="location_city" maxLength={120} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 text-neutral-100 px-3 py-2" /></label>
              <label className="text-sm text-neutral-300">Country<input name="location_country" maxLength={120} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 text-neutral-100 px-3 py-2" /></label>
            </div>
          </div>

          <div className="rounded-2xl border border-pink-700/40 bg-pink-900/10 p-4">
            <h2 className="text-lg font-semibold text-neutral-200">Interests & Disciplines</h2>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-sm text-neutral-300">Interests (comma-separated)<input name="interests" maxLength={500} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 text-neutral-100 px-3 py-2" /></label>
              <label className="text-sm text-neutral-300">Disciplines (comma-separated)<input name="disciplines" maxLength={500} className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 text-neutral-100 px-3 py-2" /></label>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-700/40 bg-neutral-900/20 p-4">
            <h2 className="text-lg font-semibold text-neutral-200">Photos</h2>
            <p className="text-xs text-neutral-400 mt-1">You can provide image URLs, upload files (if enabled), or both. Up to 5 photos.</p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[0,1,2,3,4].map((i) => (
                <div key={i} className="rounded-lg border border-neutral-800 p-3">
                  <div className="text-sm text-neutral-300">Photo {i+1}</div>
                  <input type="url" name={`photo_${i}`} placeholder="https://..." className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 text-neutral-100 px-3 py-2" />
                  <input type="file" name={`photo_file_${i}`} accept="image/*" className="mt-2 w-full text-sm text-neutral-300 file:mr-3 file:rounded file:border-0 file:bg-neutral-800 file:text-neutral-200 file:px-3 file:py-1.5" />
                  <div className="mt-2 flex items-center gap-2">
                    <label className="text-xs text-neutral-400">Position<input type="number" name={`photo_${i}_pos`} min={1} max={99} className="ml-2 w-20 rounded border border-neutral-700 bg-neutral-900 text-neutral-100 px-2 py-1" /></label>
                    <label className="text-xs text-neutral-400 inline-flex items-center gap-2"><input type="radio" name="primary_photo" value={i} /> Primary</label>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}

