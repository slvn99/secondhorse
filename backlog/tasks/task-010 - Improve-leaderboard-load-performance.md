---
id: task-010
title: Improve leaderboard load performance
status: Done
assignee:
  - '@codex'
created_date: '2025-11-06 08:22'
updated_date: '2025-11-06 08:25'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Leaderboard page queries database metadata per profile, leading to slow response times on /leaderboard. Batch metadata lookups and add regression coverage for mixed seed + database entries.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Fetch metadata for database-backed leaderboard profiles via a single batched query.
- [x] #2 Add automated coverage exercising the mixed seed/database metadata path.
- [x] #3 Retain existing leaderboard summary behaviour and pass lint/tests.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Profile current metadata query path
2. Implement batched metadata fetch and handle seed fallbacks
3. Add tests covering mixed source metadata
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Batched leaderboard metadata query to eliminate the per-profile SQL loop.
- Added Vitest coverage for mixed seed/DB leaderboards and verified summary output.
- Tests: npx vitest run tests/lib/leaderboard.test.ts
<!-- SECTION:NOTES:END -->
