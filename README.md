Second Horse Dating – Root Drop‑in (mounts at /)

How to use
- Copy `src/app/` from this folder into your new repo’s `src/app/` (it will become your site root).
- Ensure the following public assets exist in your new repo under `public/TFH/`:
  - `Tinder-for-Horses-cover-image.png`
  - `Tinder-for-Horses-background.png`
  - `tfh-og-image.png`
  - `horse_holding_a_fish.png`
  - `horse_in_a_gym.png`
  - `horse_on_a_hike.png`
  - `horse_on_beach_holiday_south_europe.png`
  - `horse_partying.png`
- Environment variables (Vercel Project → Settings → Environment Variables):
  - `DATABASE_URL` (Neon Postgres URL)
  - Optional: `BLOB_READ_WRITE_TOKEN` (for image uploads to Vercel Blob)
  - Optional: `ALLOWED_HOSTS` (comma-separated hostnames for CSRF allowlist in the form handler)

Notes
- This variant mounts the app at `/`. The profile creation page is at `/new`.
- All imports are relative; no `@/*` alias is required.
- The UI text uses the product name “Second Horse Dating”. The phrase “tinder for horses” may appear in tagline copy only.
- Moderation dashboard: approvals happen via https://samvannoord.nl/moderation (human review before publishing).

Troubleshooting
- Error "Cannot find module './586.js'" from `.next/server/...` usually means a stale or corrupted Next.js build cache. Run `npm run clean` and restart dev (`npm run dev`). If it persists, `npm run reset` to reinstall deps and rebuild.
- Ensure Node >= 18.18 or 20.x.
- On Windows, disable antivirus/file-sync locks on `.next/` while running dev.
