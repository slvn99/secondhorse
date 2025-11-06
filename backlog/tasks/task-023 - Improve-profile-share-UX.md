---
id: task-023
title: Improve profile share UX
status: Done
assignee:
  - '@codex'
created_date: '2025-11-06 15:06'
updated_date: '2025-11-06 15:11'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Profile share button should reliably offer native share flow and clear copy feedback.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Profile share button invokes the device native share sheet when supported.
- [x] #2 Fallback copy flow provides clear confirmation to the user.
- [x] #3 Matches list share button mirrors the same behavior as the profile modal.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
$1. Inspect current share handlers in profile modal and matches components for inconsistencies.
2. Extract a shared shareProfile helper that prefers the Web Share API with clipboard fallback and returns a status flag.
3. Update share buttons to call the helper, showing native sheet when available and consistent confirmation UI otherwise.
4. Cover helper behavior with unit tests to keep regression protection.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
$- Added shareWithNativeOrCopy helper to centralize Web Share API usage with clipboard fallback.
- Updated profile modal, matches list, sidebar, and deck share buttons to reuse the helper and display consistent copy feedback.
- Added unit coverage for share fallback logic and ran `npx vitest run tests/lib/share.test.ts`.
<!-- SECTION:NOTES:END -->
