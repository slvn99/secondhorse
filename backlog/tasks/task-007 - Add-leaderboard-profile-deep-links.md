---
id: task-007
title: Add leaderboard profile deep links
status: In Progress
assignee:
  - '@codex'
created_date: '2025-10-27 16:00'
updated_date: '2025-10-27 16:03'
labels:
  - ui feature
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Allow users to follow a leaderboard entry to its profile view so they can see full details.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Add a stable href for leaderboard entries that preserves profile context.
- [ ] #2 Ensure the link works for both database-backed and seed profiles.
- [ ] #3 Keep the leaderboard layout accessible and mobile-friendly after the change.
- [ ] #4 Add tests covering generated links for both profile types.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extend leaderboard entries with route params pointing to browse screen.
2. Update UI to wrap entries with the navigation target while preserving layout.
3. Add tests validating generated links for db and seed profiles.
<!-- SECTION:PLAN:END -->
