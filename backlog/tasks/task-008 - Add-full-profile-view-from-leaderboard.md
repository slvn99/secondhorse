---
id: task-008
title: Add full profile view from leaderboard
status: Done
assignee:
  - '@codex'
created_date: '2025-10-29 10:06'
updated_date: '2025-10-29 10:19'
labels:
  - ui feature
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Leaderboard entries should open the same detailed profile modal experience used in matches, including seeded and database horses.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Expose a standalone profile view route or modal that can be launched from leaderboard entries.
- [x] #2 Reuse the existing profile modal styling/interaction so the experience matches matches sidebar.
- [x] #3 Support both database and seeded profiles, handling missing data gracefully.
- [x] #4 Update leaderboard links and tests accordingly.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Introduce profile route that renders existing modal contents on page load.
2. Update leaderboard links to target new route and pass necessary params.
3. Ensure tests cover db/seed linking and modal rendering.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
$- Added query-driven profile modal launch so leaderboard entries open the existing profile overlay for db and seed horses.
- Updated leaderboard links to emit ?profile keys and introduced a TFH client test covering both profile types.
- Ensured modal close cleans up URL params and documented deep link behaviour in tests.
<!-- SECTION:NOTES:END -->
