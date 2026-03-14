ALTER TABLE waitlist_entries
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_waitlist_entries_verified_at
  ON waitlist_entries (verified_at);
