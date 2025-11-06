---
id: task-025
title: Prevent profile modal on refresh
status: Done
assignee:
  - '@codex'
created_date: '2025-11-06 15:34'
updated_date: '2025-11-06 15:38'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Refreshing a profile or match page currently opens the full profile modal instead of the expected screen. Ensure direct loads and reloads land on the proper profile page or match screen without auto-opened overlays.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Reloading /profiles/[id] renders the standard profile page layout without the modal.
- [x] #2 Refreshing the match screen on mobile does not open the full profile modal on load.
- [x] #3 Manual interactions that should open the modal continue to work.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
$1. Review TfhClient query-init logic to confirm why refresh reopens the modal.
2. Update the URL sync effect so profile params only persist while the modal is open.
3. Re-run reasoning/spot checks to ensure direct reloads land on the base view and manual modal toggles still work.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
$- Stop persisting the profile query param once the modal closes so reloads land on the base browse view.
- Keep deep links working by only syncing the profile key while the modal is active and continuing to drop legacy id/p params.
- Tests: npm run lint
<!-- SECTION:NOTES:END -->
