-- Vote guardrails & abuse tracking
-- Adds client hashing metadata, flagged vote tracking, and guard event log.

ALTER TABLE profile_votes
  ADD COLUMN IF NOT EXISTS client_hash TEXT,
  ADD COLUMN IF NOT EXISTS flagged BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_profile_votes_client_hash_created_at
  ON profile_votes (client_hash, created_at DESC);

CREATE TABLE IF NOT EXISTS profile_vote_guard_events (
  id           BIGSERIAL PRIMARY KEY,
  client_hash  TEXT,
  profile_key  TEXT,
  reason       TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_vote_guard_events_client_hash
  ON profile_vote_guard_events (client_hash, created_at DESC);
