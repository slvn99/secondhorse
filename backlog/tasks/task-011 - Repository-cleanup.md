---
id: task-011
title: Repository cleanup
status: Done
assignee:
  - '@codex'
created_date: '2025-11-06 08:41'
updated_date: '2025-11-06 08:53'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Audit the codebase for redundant directories or files and streamline the structure without breaking existing features.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Produce a list of redundant or unused directories/files and remove or archive them as appropriate.
- [x] #2 Update imports, configuration, and scripts to align with the cleaned directory structure.
- [x] #3 Run linting and tests to confirm cleanup introduces no regressions.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
$1. Audit repo for unused assets or directories by searching references and checking empty folders.
2. Remove redundant assets/directories and adjust any related imports or docs.
3. Run lint and tests to ensure cleanup is safe.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
$- Removed unused TFH assets (horse_driving_a_car.png, horse_on_a_laptop.png) after confirming they are not referenced in the app or tests.
- Existing imports and configs required no updates because the removed files had no consumers.
- Tests: npm run lint; npm test
<!-- SECTION:NOTES:END -->
