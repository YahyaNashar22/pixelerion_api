CREATE TABLE users (
 id TEXT PRIMARY KEY, username TEXT NOT NULL COLLATE NOCASE UNIQUE,
 email TEXT NOT NULL COLLATE NOCASE UNIQUE, password_hash TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('ADMIN','CLIENT')),
 business_name TEXT NOT NULL DEFAULT '', business_details TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at TEXT NOT NULL);
CREATE INDEX sessions_user ON sessions(user_id);
CREATE TABLE password_resets (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at TEXT NOT NULL);
CREATE TABLE plans (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL,
 price_cents INTEGER NOT NULL CHECK(price_cents>=0), currency TEXT NOT NULL DEFAULT 'USD',
 included_minutes INTEGER NOT NULL CHECK(included_minutes>0), duration_months INTEGER NOT NULL DEFAULT 1 CHECK(duration_months BETWEEN 1 AND 120),
 response_target TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1))
);
CREATE TABLE subscriptions (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), plan_id TEXT NOT NULL REFERENCES plans(id),
 plan_name TEXT NOT NULL, price_cents INTEGER NOT NULL, included_minutes INTEGER NOT NULL,
 starts_at TEXT NOT NULL, ends_at TEXT NOT NULL, payment_reference TEXT NOT NULL, terms_accepted INTEGER NOT NULL CHECK(terms_accepted=1)
);
CREATE INDEX subscriptions_user ON subscriptions(user_id,ends_at);
CREATE TABLE minute_ledger (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), minutes INTEGER NOT NULL CHECK(minutes<>0),
 description TEXT NOT NULL, expires_at TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, actor_id TEXT NOT NULL REFERENCES users(id)
);
CREATE INDEX minutes_user ON minute_ledger(user_id,expires_at);
CREATE TABLE projects (
 id TEXT PRIMARY KEY, client_id TEXT NOT NULL REFERENCES users(id), title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','halted','completed')),
 halt_reason TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL
);
CREATE INDEX projects_client ON projects(client_id);
CREATE TABLE phases (
 id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id), title TEXT NOT NULL,
 due_date TEXT NOT NULL, amount_cents INTEGER NOT NULL CHECK(amount_cents>=0), currency TEXT NOT NULL DEFAULT 'USD',
 status TEXT NOT NULL DEFAULT 'planned' CHECK(status IN ('planned','in_progress','completed')),
 payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid','paid')),
 payment_reference TEXT NOT NULL DEFAULT '', paid_at TEXT NOT NULL DEFAULT '', position INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX phases_project ON phases(project_id);
CREATE TABLE tasks (
 id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id), phase_id TEXT REFERENCES phases(id),
 title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'backlog' CHECK(status IN ('backlog','todo','in_progress','review','done')), created_at TEXT NOT NULL
);
CREATE INDEX tasks_project ON tasks(project_id);
CREATE TABLE comments (
 id TEXT PRIMARY KEY, task_id TEXT NOT NULL REFERENCES tasks(id), author_id TEXT NOT NULL REFERENCES users(id),
 body TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE attachments (
 id TEXT PRIMARY KEY, task_id TEXT NOT NULL REFERENCES tasks(id), filename TEXT NOT NULL, media_type TEXT NOT NULL,
 size INTEGER NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE requests (
 id TEXT PRIMARY KEY, client_id TEXT NOT NULL REFERENCES users(id), kind TEXT NOT NULL CHECK(kind IN ('support','plan_change','minutes','cancellation')),
 title TEXT NOT NULL, body TEXT NOT NULL, plan_id TEXT REFERENCES plans(id), minutes INTEGER NOT NULL DEFAULT 0 CHECK(minutes>=0),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','declined','resolved')),
 admin_note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX requests_client ON requests(client_id,created_at);
CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
INSERT INTO settings VALUES ('payment_instructions','Please contact Pixelerion for Whish, OMT or bank transfer instructions. Include your project and phase name in the transfer reference. Payments are confirmed manually.');
CREATE TABLE audit_log (id INTEGER PRIMARY KEY, actor_id TEXT NOT NULL REFERENCES users(id), action TEXT NOT NULL, resource_id TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE email_outbox (
 id TEXT PRIMARY KEY, recipient TEXT NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL,
 attempts INTEGER NOT NULL DEFAULT 0, next_attempt TEXT NOT NULL, sent_at TEXT NOT NULL DEFAULT '', last_error TEXT NOT NULL DEFAULT ''
);
INSERT INTO plans(id,name,description,price_cents,included_minutes,response_target) VALUES
 ('standard','Standard','Bug investigation, minor fixes, dependency updates, basic deployment and health checks, configuration and email support.',6000,180,'Within 2 business days'),
 ('professional','Professional','Everything in Standard, priority support, database and API troubleshooting, security updates, minor UI/content changes, incident investigation and a monthly technical health review.',14000,420,'Within 1 business day'),
 ('premium','Premium','Everything in Professional, highest priority, infrastructure and performance investigation, CI/CD assistance, security maintenance, consultation and a monthly maintenance review.',30000,900,'Critical production incidents: within 4 business hours during business hours. Normal requests: within 1 business day');
