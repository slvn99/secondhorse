---
id: task-002
title: Expose profile vote APIs
status: Done
assignee:
  - '@codex'
created_date: '2025-10-23 14:37'
updated_date: '2025-10-23 15:03'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Once vote persistence exists we need HTTP endpoints that accept user ratings and return leaderboard data so the client can interact with shared statistics.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 POST /api/profiles/[id]/vote accepts like or dislike payloads, validates input, and persists through the new data helpers.
- [x] #2 Endpoint applies rate limiting or fingerprinting to prevent rapid duplicate votes from the same client.
- [x] #3 GET /api/leaderboard returns top profiles for likes and dislikes including counts, canonical profile metadata, and profile age.
- [x] #4 Response contracts are expressed with shared TypeScript types for frontend consumers.
- [x] #5 Vitest coverage exercises success, validation, and rate limit branches for both routes using mocked data helpers.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
$1. Define shared vote/leaderboard response types and validation schema for request payloads.
2. Implement POST /api/profiles/[id]/vote with input validation, rate limiting, and Neon-backed persistence.
3. Implement GET /api/leaderboard to aggregate top liked/disliked profiles including metadata and profile age.
4. Add Vitest coverage for both routes using mocked helpers and rate limit scenarios.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
$- Added shared vote API types and identifier inference utilities to keep client/server contracts aligned.
- Implemented POST /api/profiles/[id]/vote with zod validation, profile ID inference, per-connection rate limiting, and Neon-backed persistence.
- Implemented GET /api/leaderboard with aggregated stats, metadata enrichment for DB and seeded profiles, and shared serialization helpers.
- Added Vitest coverage for vote submission and leaderboard endpoints with mocked Neon/sql clients and rate-limit scenarios.
- Tests: npm test -- --run tests/app/api/votes.test.ts
<!-- SECTION:NOTES:END -->
