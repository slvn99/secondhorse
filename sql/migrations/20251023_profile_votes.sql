-- Profile vote tracking schema migration
-- Creates raw vote events and aggregate totals to support leaderboard queries.

CREATE TABLE IF NOT EXISTS profile_votes (
  id            BIGSERIAL PRIMARY KEY,
  profile_key   TEXT NOT NULL,
  direction     TEXT NOT NULL CHECK (direction IN ('like', 'dislike')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_votes_profile_key_created_at
  ON profile_votes (profile_key, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profile_votes_direction_created_at
  ON profile_votes (direction, created_at DESC);

CREATE TABLE IF NOT EXISTS profile_vote_totals (
  profile_key    TEXT PRIMARY KEY,
  likes          INTEGER NOT NULL DEFAULT 0,
  dislikes       INTEGER NOT NULL DEFAULT 0,
  first_vote_at  TIMESTAMPTZ,
  last_vote_at   TIMESTAMPTZ,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_vote_totals_likes
  ON profile_vote_totals (likes DESC, profile_key);

CREATE INDEX IF NOT EXISTS idx_profile_vote_totals_dislikes
  ON profile_vote_totals (dislikes DESC, profile_key);
