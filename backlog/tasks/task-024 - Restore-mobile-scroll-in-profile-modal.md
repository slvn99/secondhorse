---
id: task-024
title: Restore mobile scroll in profile modal
status: Done
assignee:
  - '@codex'
created_date: '2025-11-06 15:32'
updated_date: '2025-11-06 15:44'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
'View Full Profile' modal content cannot scroll on small screens, so details below the fold are inaccessible. Ensure the modal supports touch/scroll interactions while keeping desktop layout unaffected.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Modal content scrolls vertically on viewports ≤ 768px when content exceeds viewport height.
- [x] #2 Desktop modal styling and behavior stay unchanged.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Reproduce the immobile modal and inspect existing layout constraints.
2. Adjust modal container styles to allow touch/vertical scrolling on small viewports without affecting desktop.
3. Validate behavior across breakpoints and run targeted checks.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Added dynamic viewport unit fallback + safe-area aware spacing so the modal height calc stays valid on older browsers.
- Ensured the modal content stack sets min-h-0 to let the scrollable body actually flex on narrow screens.
- Tests: npm run test -- ProfileModal
<!-- SECTION:NOTES:END -->
