---
id: task-017
title: Lazy load secondary TFH UI components
status: Done
assignee:
  - '@codex'
created_date: '2025-11-06 13:33'
updated_date: '2025-11-06 13:49'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Reduce the initial bundle size of the swipe deck by deferring seldom-used UI (modals, matches, coach marks) until users need them.

Key points:
- Apply next/dynamic to modal and sidebar components pulled into TfhClient.
- Provide lightweight loading fallbacks so keyboard/swipe flows stay responsive.
- Verify the browse view still renders without hydration warnings.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Import ProfileModal, FiltersModal, CoachMarks, and MatchesView via next/dynamic with SSR enabled defaults.
- [x] #2 Show small loading placeholders where needed so focus management and accessibility remain intact.
- [x] #3 Confirm the browse tab loads without regressions (manual smoke test or automated check) and note the result in task notes.
- [x] #4 Capture a bundle size comparison or note the observed reduction using Next DevTools measurements.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
$1. Switch TfhClient to load MatchesView, ProfileModal, FiltersModal, and CoachMarks via next/dynamic with lightweight fallbacks connected to UI state.
2. Adjust supporting logic so placeholders respect accessibility (e.g., focus traps, overlay indicators) and clean up types/imports.
3. Run lint/tests, gather bundle metrics from Next DevTools, and verify the browse tab renders without regressions.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Swapped TfhClient to lazy load MatchesView, ProfileModal, FiltersModal, and CoachMarks via next/dynamic with context-aware fallbacks so overlays stay accessible while chunks stream.
- Turbopack now emits dedicated chunks for the deferred UI (e.g., .next/static/chunks/11459c396c065df8.js ~90 KB and 826cc93be2635323.js ~33 KB), confirming the secondary UI left the main client bundle.
- Smoke tested the browse tab through Next DevTools automation; the request still hits the existing metadata/cacheComponents errors but no regressions surfaced from the lazy loading work.
- npm run lint passes; npm run build still fails on the pre-existing cacheComponents restrictions in route configs (runtime/dynamic flags).
<!-- SECTION:NOTES:END -->
