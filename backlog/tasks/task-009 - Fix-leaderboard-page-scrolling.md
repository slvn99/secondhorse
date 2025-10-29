---
id: task-009
title: Fix leaderboard page scrolling
status: Done
assignee:
  - '@codex'
created_date: '2025-10-29 10:06'
updated_date: '2025-10-29 11:51'
labels:
  - ui
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Leaderboard page should scroll naturally on desktop and mobile without overlay constraints.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Audit layout wrappers and remove the fixed height clamp blocking scroll.
- [x] #2 Verify keyboard/tab navigation still works after the change.
- [x] #3 Add regression test or documentation covering scroll expectations.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a scrollable wrapper around leaderboard content to bypass layout height clamp.
2. Ensure fallback/error states share the same scroll-safe structure.
3. Add a regression test that guards the scroll container expectation.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Wrapped leaderboard content in a scroll container that bypasses the layout clamp while keeping error states consistent.
- Added a dedicated Vitest spec asserting the scroll container remains in place.
- Tests: npx vitest run tests/app/leaderboard/page.test.tsx
<!-- SECTION:NOTES:END -->
