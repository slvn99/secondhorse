---
id: task-021
title: Add dedicated profile route
status: In Progress
assignee:
  - '@codex'
created_date: '2025-11-06 13:38'
updated_date: '2025-11-06 14:15'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Expose each horse at a stable server-rendered URL so deep links don’t rely on client-only logic.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Create app/profiles/[id]/page.tsx that loads the horse by id or name hash (supports DB and seed).
- [x] #2 Share UI with the swipe deck (reuse ProfileModal or a lightweight profile component) while keeping the page mostly static.
- [x] #3 Wire up generateStaticParams for seeded horses and ensure database lookups still work via dynamic fallback.
- [x] #4 Update internal links/sharing so ?id= use redirects or navigates to the new route.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extract reusable profile lookup helpers and update metadata.
2. Build /profiles/[id] route leveraging ProfileModal in standalone mode.
3. Update share/navigation flows to use canonical profile URLs and redirect legacy params.
4. Add coverage for new helpers and run targeted vitest suites.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
$- Added shared profile lookup + metadata helpers and updated API to reuse them.
- Exposed /profiles/[id] page reusing ProfileModal in standalone mode with static params for seed horses.
- Pointed share/navigation flows at canonical profile URLs and redirect legacy ?id/?p links.
- Added vitest coverage for metadata/path helpers.
- Tests: npm run test -- page.metadata; npm run test -- profilePath.
<!-- SECTION:NOTES:END -->
