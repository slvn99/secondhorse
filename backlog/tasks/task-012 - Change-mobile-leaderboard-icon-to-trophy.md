---
id: task-012
title: Change mobile leaderboard icon to trophy
status: Done
assignee:
  - '@codex'
created_date: '2025-11-06 08:43'
updated_date: '2025-11-06 08:45'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Update the mobile bottom navigation so the leaderboard tab uses a trophy emoji instead of the current LB icon.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Mobile bottom nav renders the leaderboard tab with a trophy emoji.
- [x] #2 Non-mobile navigation remains unchanged.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Inspect current bottom nav component
2. Update the leaderboard icon to a trophy emoji on mobile.
3. Verify nav renders correctly and no other views changed.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Swapped the mobile leaderboard icon text for a trophy emoji.
- Confirmed other nav buttons and desktop navigation stay the same.
- Tests not run (UI-only visual tweak).
<!-- SECTION:NOTES:END -->
