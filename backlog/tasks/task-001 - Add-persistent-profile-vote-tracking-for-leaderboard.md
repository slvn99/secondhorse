---
id: task-001
title: Add persistent profile vote tracking for leaderboard
status: Done
assignee:
  - '@codex'
created_date: '2025-10-23 14:37'
updated_date: '2025-10-23 14:52'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Likes and dislikes are stored only in local storage today, so we cannot surface global statistics. Build the server-side persistence layer that captures vote events and exposes aggregated counts per profile so future API and UI work can rely on it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Schema migration adds raw vote and totals tables with indexes optimized for leaderboard queries.
- [x] #2 Vote recording supports both database profile UUIDs and hashed IDs for seeded horses.
- [x] #3 Data access helper exposes recordProfileVote and returns up-to-date like and dislike totals per profile.
- [x] #4 Helpers calculate profile age from profiles.created_at with a safe fallback so callers don’t duplicate that logic.
- [x] #5 Vitest coverage verifies the aggregation helpers and ID normalization using mocked Neon clients.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
$1. Audit existing Neon data flows and decide how to normalize profile IDs for database-backed and seeded horses.
2. Add SQL migration(s) that create vote event and aggregate tables with the indexes we need for leaderboard queries.
3. Implement vote persistence helpers in src/lib (recordProfileVote, fetchProfileVoteTotals, profileAge days calculation) reusing Neon connection utilities.
4. Cover helpers with Vitest using mocked Neon clients to assert aggregation math and ID normalization behaviors.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
$- Added migration for vote events and aggregates plus supporting indexes.
- Created shared profile ID normalization/stable hash helpers for DB and seeded horses.
- Implemented Neon-backed vote persistence helpers returning aggregated counts and profile age fallbacks.
- Added Vitest coverage with a mocked Neon client to exercise aggregation and normalization.
- Tests: npm test -- --run tests/lib/profileVotes.test.ts
<!-- SECTION:NOTES:END -->
