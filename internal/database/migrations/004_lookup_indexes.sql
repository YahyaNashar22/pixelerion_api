CREATE INDEX sessions_expiry ON sessions(expires_at);
CREATE INDEX resets_user ON password_resets(user_id);
CREATE INDEX comments_task ON comments(task_id,created_at);
CREATE INDEX attachments_task ON attachments(task_id);
CREATE INDEX outbox_pending ON email_outbox(sent_at,next_attempt);
