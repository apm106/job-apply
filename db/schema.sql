CREATE TABLE IF NOT EXISTS waitlist_entries (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  verified_at TIMESTAMPTZ,
  verification_token_hash TEXT,
  verification_token_expires_at TIMESTAMPTZ,
  verification_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_entries_created_at
  ON waitlist_entries (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_waitlist_entries_verified_at
  ON waitlist_entries (verified_at);
