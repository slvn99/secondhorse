---
id: task-018
title: Add loading skeletons for slow routes
status: Done
assignee:
  - '@codex'
created_date: '2025-11-06 13:33'
updated_date: '2025-11-06 13:43'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Provide instant feedback while the home deck and leaderboard fetch data by adding Next.js loading UIs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Create app/loading.tsx with a lightweight skeleton or spinner that matches the app styling.
- [x] #2 Add app/leaderboard/loading.tsx so the leaderboard shows a friendly placeholder during DB work.
- [x] #3 Ensure both loading states are free of blocking client logic (pure server components or simple JSX).
- [x] #4 Manually verify navigation to / and /leaderboard shows the new loading UI when data is slow (can be simulated).
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Review / and /leaderboard data loading to understand layout and dependencies
2. Create app/loading.tsx mirroring the hero background with a lightweight spinner
3. Create leaderboard/loading.tsx with skeleton rows that match the leaderboard styling
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Added app/loading.tsx with the same backdrop and a lightweight spinner to keep navigation responsive while horse data resolves
- Added leaderboard/loading.tsx with placeholder rows to cover leaderboard fetch delays
- Ran npm run lint to verify no lint issues and noted the existing cacheComponents/revalidate warning from the dev server
<!-- SECTION:NOTES:END -->
