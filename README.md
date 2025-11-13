Second Horse Dating (Tinder‑for‑Horses)

**Overview**
- **What**: A playful swipe UI to browse horse profiles, save matches locally, and optionally accept new profile submissions.
- **Where**: App mounts at `/` (home). Profile creation lives at `/new`. Basic health check at `/api/health`.
- **Data**: Reads from Neon Postgres when `DATABASE_URL` is set; otherwise falls back to local seed data in `src/lib/horses.ts`.

**Key Features**
- **Swipe deck**: Like/dislike with buttons or keyboard (Left/Right, Enter). Undo via `Z`.
- **Saved matches**: Stored in `localStorage`, with a dedicated Matches view.
- **Filters**: Gender and age range; persists in `localStorage`.
- **Deep linking**: URL reflects the current profile; share button copies a direct link.
- **Leaderboard**: `/leaderboard` exposes community likes/dislikes with summary statistics.
- **Profile submissions**: `/new` accepts URLs and file uploads (Vercel Blob when configured). Optional hCaptcha in production.
- **Project info + sidebar**: Collapsible sidebar with project notes and version/date from Git.
- **Analytics**: Vercel Analytics integrated.
- **Fresh caching**: Cache Components tag horse and leaderboard data (`horses`, `leaderboard`) so pages stay responsive while votes and new profiles trigger revalidation.

**Tech Stack**
- **Framework**: `Next.js 16` (App Router, Cache Components opt-in, server actions)
- **Language**: TypeScript, React 18
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer
- **DB**: Neon serverless Postgres via `@neondatabase/serverless` (optional)
- **Storage**: Vercel Blob for images via `@vercel/blob` (optional; dev fallback to `public/uploads`)
- **Testing**: Vitest (`tests/`)
- **Linting**: ESLint (`next/core-web-vitals`)
- **Misc**: Vercel Analytics, small audio helper with `tone` to satisfy autoplay policies

**Project Structure**
- `src/app`: App Router pages, layouts, server actions
  - `page.tsx`: Home feed; reads DB (if available) else local seed
  - `layout.tsx`: Shell, sidebars, footer, analytics
  - `_components/`: Client components (`TfhClient`, `HorseSwiper`, `MatchesView`, etc.)
  - `_lib/uploads.ts`: Server action helper for image handling (Blob/dev‑disk)
  - `new/`: Profile creation form and client helpers
  - `api/health/route.ts`: Minimal JSON health endpoint
- `src/lib`: Domain utilities and data (`horses.ts`, `tfh.ts`, `git.ts`, etc.)
- `src/types`: Local type shims
- `public/TFH`: Static images used by the UI
- `scripts/`: Dev utilities (`clean.mjs`, `reset.mjs`)
- `tests/`: Vitest tests (e.g., seed data validation)
- `v2/`: Reference only; do not depend on it

**Getting Started**
- **Requirements**: Node `>= 20.9`, npm
- **Install**: `npm install`
- **Dev server**: `npm run dev` then open `http://localhost:3000`
- **Type check**: `npm run type-check`
- **Lint**: `npm run lint` (auto-fix: `npm run lint:fix`)

**Next.js DevTools MCP**
- `.mcp.json` registers the official `next-devtools-mcp` Model Context Protocol server.
- Start the dev server with `npm run dev`; MCP-compatible coding agents will auto-discover the running instance.
- See [Next.js DevTools MCP docs](https://nextjs.org/docs/app/guides/mcp) for available tools (error inspection, logs, page metadata, etc.).

**Scripts**
- `npm run dev`: Start local dev with HMR
- `npm run build`: Production build
- `npm start`: Run compiled server
- `npm run lint`: ESLint checks (`next/core-web-vitals`)
- `npm run type-check`: TypeScript without emit
- `npm run clean`: Remove `.next/.turbo` caches using the cross-platform Node helper
- `npm run reset`: Clean caches and reinstall dependencies via the Node helper
- `npm test`: Run Vitest once
- `npm run test:watch`: Vitest in watch mode
- `npm run coverage`: Coverage report (v8)

**Environment Variables**
- `DATABASE_URL`: Neon Postgres connection string. Enables reading/writing profiles.
- `BLOB_READ_WRITE_TOKEN` (optional): Enables public image uploads to Vercel Blob on `/new`.
- `ALLOWED_HOSTS` (optional): Comma-separated hostnames allowed to submit the form (CSRF guard).
- `HCAPTCHA_SECRET` (optional): When set in production, `/new` requires hCaptcha.
- **Vote guard tuning (optional)**:
  - `VOTE_GUARD_SALT`: Secret salt for hashing client identifiers before storing them.
  - `VOTE_GUARD_MINUTE_LIMIT`: Max votes per client hash within `VOTE_GUARD_MINUTE_WINDOW_MS` (default 15 / 60s).
  - `VOTE_GUARD_HOURLY_LIMIT`: Max votes per client hash within `VOTE_GUARD_HOURLY_WINDOW_MS` (default 120 / 1h).
  - `VOTE_GUARD_PROFILE_LIMIT`: Max votes per profile/client hash within `VOTE_GUARD_PROFILE_WINDOW_MS` (default 6 / 24h).
  - (Advanced) `VOTE_GUARD_MINUTE_WINDOW_MS`, `VOTE_GUARD_HOURLY_WINDOW_MS`, `VOTE_GUARD_PROFILE_WINDOW_MS` override the time windows if you need custom intervals.
- `ENABLE_LEADERBOARD` (optional): Feature flag for `/leaderboard` when you want to gate the page during rollout.

- `NEXT_PUBLIC_SITE_URL` (optional): Used for absolute metadata base.
- `VERCEL_GIT_COMMIT_SHA`/`GITHUB_SHA`/`COMMIT_SHA` (optional): Used for version label in the UI.

Place secrets in `.env.local` and never commit them. A sanitized `.env.example` is included for local setup. Note for contributors: do not delete or modify someone else’s local `.env.local`. If you need to change env usage, update docs and `.env.example` instead.

Security note: a previously committed `.env.local` has been removed from the repo. You should rotate/revoke any exposed credentials in that file and, if needed, purge it from git history (e.g., with `git filter-repo`).

**Data & Storage Behavior**
- **Read path**: `src/app/page.tsx` attempts DB first (via Neon); on failure or unset `DATABASE_URL`, it falls back to `src/lib/horses.ts` seed data.
- **Write path**: `/new` uses a server action. On production with `HCAPTCHA_SECRET`, hCaptcha must pass. Photos are stored via:
  - Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set (public URLs), or
  - Local dev fallback in `public/uploads` when not in production.
- **Local state**: Matches, filters, and deck index persist in `localStorage`.
- **Votes**: Global like/dislike counts persist in Postgres. The schema ships in `sql/migrations/20251023_profile_votes.sql`.

**Leaderboard & Vote Persistence**
- Apply the migration before deploying:
  ```bash
  psql "$DATABASE_URL" -f sql/migrations/20251023_profile_votes.sql
  ```
- The vote API writes raw events (`profile_votes`) and maintains aggregates (`profile_vote_totals`). Aggregates power `/leaderboard`.
- Vote guardrails hash the caller’s address, throttle burst voting, and log flagged attempts (`profile_vote_guard_events`). Guard settings are controlled via the `VOTE_GUARD_*` environment variables above.
- To seed sample data locally, you can insert rows manually:
  ```sql
  INSERT INTO profile_vote_totals (profile_key, likes, dislikes, first_vote_at, last_vote_at, updated_at)
  VALUES ('seed:abc123', 5, 2, now() - interval '7 days', now(), now());
  ```
  Then run `npm run dev` and visit `http://localhost:3000/leaderboard`.
- When `ENABLE_LEADERBOARD` is set (see `.env.example`), the UI can be toggled during rollout while APIs remain active.

**Images, Assets, and Security Headers**
- Remote images are whitelisted in `next.config.ts` (Unsplash, Notion, Vercel Blob, etc.).
- Rewrites expose TFH assets under stable paths (e.g., `/TFH/...`). Ensure the images in `public/TFH` remain present.
- Strict headers are configured: CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy.

**Testing**
- Run all tests: `npm test`
- Watch mode: `npm run test:watch`
- Coverage (opt-in): `npm run coverage` (HTML report in `coverage/`). Coverage is enabled when `COVERAGE=1` is set.
- Target: Keep ≥80% coverage for changed code. Example: `tests/lib/horses.test.ts` validates seed data shape.
- Leaderboard + vote APIs: use `npm test -- --run tests/app/leaderboard/leaderboardClient.test.tsx tests/app/hooks/useVoteQueue.test.ts tests/app/api/votes.test.ts` to exercise the new feature end-to-end.

**Testing Approach & Patterns**
- Environment: Vitest with `jsdom` (see `vitest.config.ts`) and project aliases (`@` → `src`).
- Global setup: `tests/setup.ts`
  - Mocks `next/image` to a plain `img` for DOM tests.
  - Provides a minimal `renderElement()` helper using `react-dom/client` for simple mounting.
  - Seeds a deterministic RNG for TFH matching via `localStorage`.
- Module mocking:
  - Audio: Mock `tone` and verify `ensureAudioOnce()` idempotency (see `tests/lib/audioGate.test.ts`).
  - Child processes: `src/lib/git.ts` exposes `__setExecSyncForTests` to inject a fake `execSync` in tests (avoids brittle ESM spies on built‑ins). See `tests/lib/git.test.ts`.
- Coverage ergonomics: Coverage is disabled by default for speed and enabled only in `npm run coverage` via `COVERAGE=1`.
- React act warnings: Some component tests log act(...) warnings. Where needed, wrap interactions in `act(async () => ...)` or use async utilities (e.g., `waitFor`). These warnings are non‑fatal but should be addressed when expanding the test suite.

**Housekeeping**
- Cleanup build caches: `npm run clean` removes `.next`, `.turbo`, `coverage/`, and TS build info (`*.tsbuildinfo`).
- Deep reset: `npm run reset` clears caches, reinstalls deps, and rebuilds.

**Deployment**
- Designed for Vercel (Next.js 15). Ensure required env vars are set on the project.
- Production constraints:
  - Set `ALLOWED_HOSTS`.
  - Add `HCAPTCHA_SECRET` if you want captcha on `/new`.
  - Add `BLOB_READ_WRITE_TOKEN` to allow file uploads; without it, uploads are disabled in prod.

**Troubleshooting**
- **Stale build cache**: Error like `Cannot find module './586.js'` → `npm run clean` then `npm run dev`. If it persists: `npm run reset`.
- **Node version**: Use Node `>= 20.9`.
- **Asset paths**: If images 404, verify `public/TFH` exists and Next rewrites are active.

**License**
- Code and assets in this repo are available under the [MIT License](./LICENSE). Keep the copyright notice intact when you reuse or re-publish so credit stays with Sam van Noord.

**Suggested Improvements**
- Testing
  - Increase coverage of `src/lib/tfh.ts` by extracting pure helpers (e.g., RNG seeding, filter persistence, index persistence) and writing unit tests for them. Consider `@testing-library/react` and `act()`/`waitFor` to remove warnings.
  - Add a basic E2E smoke test (Playwright) for the swipe flow and Matches.
- Type safety
  - Tighten types in server actions and files currently excluded from strictness; add runtime env validation (e.g., `zod`) for critical vars.
- CI & automation
  - Add a GitHub Actions workflow: lint, type‑check, tests, and coverage upload (HTML as artifact).
  - Add pre‑commit hooks with `lint-staged` (format/lint staged files).
- DX
  - Provide `.env.example` with non‑secret placeholders and document required vars in README.
  - Split `src/lib/tfh.ts` into smaller modules (matches, filters, index) to improve readability and testability.
- Performance & UX
  - Audit client bundles for large deps; consider dynamic imports for heavier UI parts.
  - Ensure all interactive elements have accessible names/ARIA and keyboard support; add unit tests for focus/keyboard flows.
- Tooling & Ops
  - Add automated migrations runner for the vote tables to avoid manual execution in production.

**Moderation**
- Profiles are reviewed by a human via: `https://samvannoord.nl/moderation`.
- The app sets a one‑time toast after form submission; moderation state is not synced back automatically.

**Notes**
- Keyboard shortcuts: Left/Right/Enter to swipe, `Z` to undo.
- Health endpoint: `GET /api/health` returns `{ ok: true, timestamp }`.
- TypeScript excludes `src/app/new/**/*` and `src/app/_lib/uploads.ts` from strict checking to ease server action ergonomics.

