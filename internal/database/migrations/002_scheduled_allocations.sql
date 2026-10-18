ALTER TABLE minute_ledger ADD COLUMN available_at TEXT NOT NULL DEFAULT '';
ALTER TABLE subscriptions ADD COLUMN duration_months INTEGER NOT NULL DEFAULT 1;
ALTER TABLE email_outbox ADD COLUMN expires_at TEXT NOT NULL DEFAULT '';
