**Next.js 15 Scaffold + Tailwind CSS**

- Dev: `npm install` then `npm run dev`
- Build: `npm run build` then `npm start`
- Lint: `npm run lint`  •  Types: `npm run type-check`

Structure
- `src/app/`: App Router with `layout.tsx`, `page.tsx`
- `src/app/api/health/route.ts`: Simple JSON health endpoint
- `public/`: Static assets (e.g., `favicon.svg`)

Notes
- Uses TypeScript, strict mode, and `@/*` import alias.
- Configured with `next.config.ts` and `eslint` via `next/core-web-vitals`.
- Tailwind CSS configured via `tailwind.config.ts` and `postcss.config.js`.

Tailwind
- Files scanned: `src/app/**/*`, `src/components/**/*`, `src/pages/**/*`.
- Directives added in `src/app/globals.css`.
- Customize theme in `tailwind.config.ts` under `theme.extend`.
