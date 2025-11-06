---
id: task-013
title: Fix base URL sanitizer to respect http inputs
status: Done
assignee:
  - '@codex'
created_date: '2025-11-06 08:46'
updated_date: '2025-11-06 08:56'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
resolveBaseUrl() currently forces every candidate to https, so setting NEXT_PUBLIC_SITE_URL to an http:// localhost origin generates canonical URLs that point to https and break local/preview metadata. Update the sanitiser to preserve explicit schemes and add coverage for the precedence order.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Preserve the original scheme when NEXT_PUBLIC_SITE_URL or other env values include http:// or https:// prefixes.
- [x] #2 Keep https as the default only when falling back to bare hostnames without a scheme.
- [x] #3 Add unit tests exercising env precedence and scheme preservation for resolveBaseUrl().
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
$1. Update resolveBaseUrl sanitizer to keep explicit http/https schemes while normalizing hostnames without protocols.
2. Add targeted unit tests covering env precedence and scheme preservation.
3. Run lint and vitest to ensure the change is safe.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
$- Preserve http/https schemes in resolveBaseUrl() while keeping https for bare hostnames.
- Added tests/lib/baseUrl.test.ts to cover env precedence and scheme trimming.
- Tests: npm run lint; npm test
<!-- SECTION:NOTES:END -->
