---
id: task-019
title: Test useVoteQueue retry logic
status: Done
assignee:
  - '@codex'
created_date: '2025-11-06 13:34'
updated_date: '2025-11-06 13:46'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Improve confidence in vote submission handling by covering the client-side queue and backoff behaviour with Vitest.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Add a new test suite under tests/ (e.g., tests/app/hooks/useVoteQueue.test.ts) that covers happy path, retryable failure, and fatal error scenarios.
- [x] #2 Mock fetch to assert retry delays/backoff attempts without making network calls.
- [x] #3 Verify lastError and clearError behaviour so Toast messaging stays correct.
- [x] #4 Run npm test (or targeted Vitest command) and record results in task notes.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Review useVoteQueue hook to understand queue chaining and error state updates
2. Create Vitest coverage for happy path, retry/backoff timing, and non-retryable failures
3. Run targeted Vitest suite and document results
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Added Vitest coverage for useVoteQueue covering happy path, retry backoff timing, and fatal errors.
- Mocked fetch responses and timers to assert sequential retries (800ms, 1600ms) and lastError/clearError behaviour.
- Tests: npm run test -- useVoteQueue
<!-- SECTION:NOTES:END -->
