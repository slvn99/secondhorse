---
id: task-003
title: Send vote events from swipe UI to server
status: Done
assignee:
  - '@codex'
created_date: '2025-10-23 14:37'
updated_date: '2025-10-23 15:13'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The swipe experience must report every like and dislike to the backend without breaking existing matches behavior. Wire the client to the new API and handle failures gracefully.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Swiping like or dislike triggers the vote API with the correct profile identifier and direction exactly once per action.
- [x] #2 Client provides optimistic updates and queues retries when the network request fails while keeping local matches in sync.
- [x] #3 Dislike actions persist server-side just like likes, and the local undo/remove logic stays functional.
- [x] #4 Surface lightweight user feedback (toast or inline) when a vote cannot be saved so users are aware.
- [x] #5 Add component or hook tests that cover vote dispatch, retry logic, and error handling.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
$1. Extend client vote models/hooks to send POST /api/profiles/[id]/vote with correct identifiers.
2. Implement optimistic updates and retry/error handling while preserving existing matches behavior and undo logic.
3. Surface user feedback when vote persistence fails after retries.
4. Add component or hook tests covering dispatch, retry, and error messaging.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
$- Added client vote queue hook that derives stable profile identifiers, sequences vote requests, and retries transient failures.
- Wired TfhClient swipe handler to fire vote requests for likes and dislikes while preserving existing match/undo behavior.
- Surfaced error toast feedback when votes cannot be persisted after retries.
- Added Vitest coverage for the hook (dispatch, retry, failure) and re-ran API tests.
- Tests: npm test -- --run tests/app/api/votes.test.ts tests/app/hooks/useVoteQueue.test.ts
<!-- SECTION:NOTES:END -->
