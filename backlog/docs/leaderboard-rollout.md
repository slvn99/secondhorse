# Leaderboard Rollout Checklist

Use this when promoting the vote/leaderboard feature to staging or production.

## Preconditions
- [ ] `DATABASE_URL` configured and reachable from the runtime.
- [ ] `sql/migrations/20251023_profile_votes.sql` applied (`psql "$DATABASE_URL" -f sql/migrations/20251023_profile_votes.sql`).
- [ ] `ENABLE_LEADERBOARD=1` (or equivalent flag) set in the environment when you are ready to expose `/leaderboard`.

## Smoke Tests
- [ ] Trigger a like/dislike from the swipe UI and verify `POST /api/profiles/:id/vote` returns 200.
- [ ] Hit `/api/leaderboard` directly and confirm it returns both `summary` and tab arrays.
- [ ] Visit `/leaderboard` and ensure tabs render, counts match API, and empty states are styled.

## Release Notes
- Update README with migration/env instructions (already in repo).
- Communicate the feature flag (`ENABLE_LEADERBOARD`) to ops so they can gate exposure during rollout.
- Share the Vitest command for vote/leaderboard coverage: `npm test -- --run tests/app/leaderboard/leaderboardClient.test.tsx tests/app/hooks/useVoteQueue.test.ts tests/app/api/votes.test.ts`.

