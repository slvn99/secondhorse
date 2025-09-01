Repository Guidelines
=====================

Project Structure & Module Organization
--------------------------------------
- src/: Next.js app code (App Router).
  - src/app: Routes, layouts, server actions (e.g., src/app/new/page.tsx).
  - src/lib: Domain utilities and types (e.g., horses.ts).
  - src/app/_components: Client components (e.g., TfhClient.tsx).
- public/TFH: Static TFH assets (images, audio).
- scripts/: Developer utilities (e.g., clean.sh).
- v2/: Reference only; do not depend on it. Relevant bits have been ported.

Build, Test, and Development Commands
-------------------------------------
- npm run dev: Start local dev server with HMR.
- npm run build: Create production build.
- npm start: Run the compiled server.
- npm run lint: Run ESLint checks.
- npm run type-check: TypeScript checks without emitting.
- npm run clean: Remove .next/.turbo caches.
- npm run reset: Clean caches, reinstall deps, rebuild.

Coding Style & Naming Conventions
---------------------------------
- TypeScript preferred; 2‑space indentation.
- Components: PascalCase (e.g., TfhClient.tsx). App routes use Next patterns (page.tsx, layout.tsx).
- Variables/functions: camelCase; types/interfaces: PascalCase.
- Linting via ESLint (Next config). Run lint before PRs.

Testing Guidelines
------------------
- Framework: Vitest.
- Layout: tests/ mirrors src/ or colocate.
- Naming: `*.test.ts(x)` for unit, `*.spec.ts(x)` for integration.
- Commands: `npm test` (CI), `npm run test:watch` (local), `npm run coverage` (report).
- Example: see `tests/lib/horses.test.ts` (validates TFH seed data).
- Aim for ≥80% coverage on changed code.

Commit & Pull Request Guidelines
--------------------------------
- Commits: Conventional Commits (e.g., feat(ui): add swipe actions).
- PRs: Clear summary, link issues, list changes, screenshots for UI, note breaking changes and migration steps.

Security & Configuration Tips
-----------------------------
- Do not commit secrets. Use .env.local; add required vars to .env.example.
- Key env vars: DATABASE_URL (Neon), optional BLOB_READ_WRITE_TOKEN, optional ALLOWED_HOSTS.
- Images: next.config.ts includes TFH rewrites; public/TFH must contain referenced assets.

Troubleshooting
---------------
- Error “Cannot find module './586.js'”: clear caches (npm run clean) and restart dev. If needed, run npm run reset. Ensure Node ≥ 18.18 or 20.x.
