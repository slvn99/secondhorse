---
id: task-004
title: Build public leaderboard with stats tabs
status: Done
assignee:
  - '@codex'
created_date: '2025-10-23 14:37'
updated_date: '2025-10-23 15:36'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Expose an all-user leaderboard that highlights top liked and disliked profiles along with supporting summary statistics.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Create a /leaderboard route that renders accessible tabs for likes and dislikes.
- [x] #2 Each leaderboard entry shows rank, profile identity, like or dislike totals, and profile age computed from the server data.
- [x] #3 Display summary metrics (e.g., total active profiles, total likes, total dislikes) above the tabs.
- [x] #4 Add desktop and mobile navigation affordances that link to the new leaderboard.
- [x] #5 Automated tests (Vitest or Playwright) cover rendering, basic tab interaction, and empty states.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
$1. Design leaderboard data flow and UI structure (summary metrics, likes/dislikes tabs, navigation hooks).
2. Implement /leaderboard route with server fetch + client tabs and wire new navigation links.
3. Integrate API helper reuse to avoid duplication and handle missing data states gracefully.
4. Add tests covering leaderboard rendering, tab switching, and empty state behaviour.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
$- Added generateLeaderboard helper to share aggregation logic between API and UI and reused it in the /api/leaderboard route.
- Implemented /leaderboard page with summary metrics and a tabbed LeaderboardClient plus updated navigation (sidebar + mobile bottom bar).
- Extended TfhClient mobile nav and layout sidebar to link to the public leaderboard.
- Added Vitest suite for LeaderboardClient covering tab switching and empty states.
- Tests: npm test -- --run tests/app/leaderboard/leaderboardClient.test.tsx tests/app/hooks/useVoteQueue.test.ts tests/app/api/votes.test.ts
<!-- SECTION:NOTES:END -->
