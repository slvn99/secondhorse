---
id: task-016
title: Adopt cache tags for horse data
status: Done
assignee:
  - '@codex'
created_date: '2025-11-06 13:33'
updated_date: '2025-11-06 13:44'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Enable Cache Components to efficiently cache horse and leaderboard data while ensuring votes and submissions stay fresh.

Key points:
- Turn on cacheComponents and define a reusable cacheLife profile for short-lived horse content.
- Tag horse and leaderboard fetchers so they can be invalidated after updates.
- Trigger revalidateTag from vote submissions and new profile creation to keep the deck current.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Enable cacheComponents in next.config.ts with an appropriate cacheLife profile for horses.
- [x] #2 Wrap horse and leaderboard fetch logic in 'use cache' + cacheTag with clear tag names.
- [x] #3 Call revalidateTag('horses', 'max') or equivalent from vote API and profile creation flow after successful writes.
- [x] #4 Document the cache tags and profiles in code comments or README for future contributors.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Inspect horse and leaderboard data fetchers and config.
2. Enable cacheComponents and define shared cacheLife profiles.
3. Apply cacheTag/cacheLife in loaders and hook up revalidateTag on mutations.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Enabled cacheComponents with horses/leaderboard cacheLife profiles in next.config.ts and noted defaults.
- Wrapped horse and leaderboard queries with 'use cache', cacheLife, and cacheTag to share the new profiles.
- Invalidated both tags after vote submissions and new profile creation so fresh data shows up immediately.
- Documented the caching behaviour in README. Tests not run yet; follow up with npm test after restarting dev server for new config.
<!-- SECTION:NOTES:END -->
