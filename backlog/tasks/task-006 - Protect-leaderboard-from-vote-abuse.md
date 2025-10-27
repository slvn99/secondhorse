---
id: task-006
title: Protect leaderboard from vote abuse
status: Done
assignee:
  - '@codex'
created_date: '2025-10-27 15:18'
updated_date: '2025-10-27 15:42'
labels:
  - security backend
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Detect and mitigate spam voting so automated clients cannot skew profile tallies or leaderboard rankings.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Identify signals for repeated or coordinated votes (e.g., per-IP or profile thresholds) and persist them for review.
- [x] #2 Reject or throttle votes that exceed the configured limits while keeping legitimate activity unaffected.
- [x] #3 Ensure leaderboard queries exclude throttled/flagged votes and document the protection toggles.
- [x] #4 Add tests covering allowed, throttled, and flagged scenarios.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extend vote persistence schema with client hashes and guard log.
2. Implement guard evaluation + flagged recording, wiring into vote API and totals.
3. Update docs/config toggles and add test coverage for throttled vs. allowed votes.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
$- Added client_hash + guard event schema and persisted flagged attempts for review.
- Added vote guard evaluator + hashed client handling in vote API, logging blocked attempts and passing client hash to persistence.
- Documented VOTE_GUARD_* toggles and added tests for guard decisions plus flagged vote recording.
<!-- SECTION:NOTES:END -->
