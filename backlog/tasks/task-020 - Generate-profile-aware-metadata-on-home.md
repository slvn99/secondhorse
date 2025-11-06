---
id: task-020
title: Generate profile-aware metadata on home
status: Done
assignee:
  - '@codex'
created_date: '2025-11-06 13:38'
updated_date: '2025-11-06 13:53'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Use Next.js metadata APIs to produce dynamic OG/Twitter tags for the selected horse, improving link previews when users share the deck.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Add generateMetadata to app/page.tsx that inspects searchParams for id/profile and fetches the matching horse.
- [x] #2 Populate title/description/openGraph/twitter image fields with the horse content; fall back to defaults when not found.
- [x] #3 Handle both seed and database horses so shared links always preview correctly.
- [x] #4 Verify via curl or browser inspector that the resulting HTML head updates per profile.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
$- Implemented profile-aware generateMetadata on app/page.tsx with shared helpers that inspect profile/id/p query params and pull horses from the database or seed list before falling back to defaults.
- Added targeted Vitest coverage (npm run test -- page.metadata.test.ts) covering seed and database lookups and baseline behavior.
- Verified OG/Twitter/description meta tags swap to the selected profile via Invoke-WebRequest http://localhost:3000/?profile=Marlin | Select-String ...
<!-- SECTION:NOTES:END -->
