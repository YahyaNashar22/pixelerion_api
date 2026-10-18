# Pixelerion

A Go + SQLite API and a React/Vite portfolio, client portal and private admin workspace. Payments happen externally; there is no gateway, checkout, card collection or automatic charging.

## Local development

Requirements: Go 1.27.0 or newer and Node 22.22 or newer. SQLite uses a pure Go driver; no database server or C compiler is needed.

1. Copy `.env.example` to `.env` if necessary. Set a unique bootstrap admin username, email and password (12–72 bytes).
2. Run `go run ./cmd/api` from the repository root. It loads `.env`, applies embedded SQL migrations and creates the initial administrator if absent.
3. In `client/`, run `npm ci` then `npm run dev`.
4. Visit http://localhost:8443 and sign in at `/portal/login`. Administrators go to `/admin`; clients go to `/portal/dashboard`.

The existing local `.env` was converted to SQLite. Strong bootstrap credentials were preserved; a short bootstrap password was replaced with a randomly generated password in that file. Read the file locally to retrieve it; it is ignored by Git. Bootstrap configuration creates the first account and never resets an existing password.

`PUBLIC_URL` must match the exact browser origin. Development uses the Vite proxy for `/api` and `/health`. The API intentionally rejects cross-origin mutations. To serve the built frontend directly at http://localhost:8080, set `PUBLIC_URL=http://localhost:8080` and build the frontend.

## Admin workflow

- Create client accounts under **Clients**. There is no public registration. Supply credentials privately. You can update business details or generate a one-hour reset link.
- Select a client in the header, then create their project under **Projects**.
- Add phases with USD amounts, due dates, progress and payment status. Mark paid only after verifying the external transfer and entering a reference.
- Set the project to **halted**, with a client-visible explanation, when payment delays stop work. Payment confirmation and project resumption are separate deliberate actions.
- Add backlog/tasks, assign phases, edit statuses, comment and upload private PNG/JPEG/WebP screenshots (maximum 5 MB).
- Activate a support plan only after verified payment and acceptance of terms. Minutes and price are snapshotted; subsequent catalog edits do not rewrite existing agreements.
- Client plan/minute requests appear under **Requests**. Approving a paid request atomically activates the plan or credits minutes. Repeated approval cannot credit twice. Decline or resolve without activation if appropriate.
- Log work as negative minute entries with descriptions. Corrections and paid extra minutes are positive entries. History is append-only.
- Renewals are manual. Cancellation requests are acknowledged without removing access to the current paid period; do not activate another period after cancellation.

## Support terms and durations

The initial catalog comes from the supplied **Pixelerion Support Plans.pdf**:

| Plan | Monthly fee | Minutes/month | Normal response |
| --- | --- | --- | --- |
| Standard | $60 | 180 | Within 2 business days |
| Professional | $140 | 420 | Within 1 business day |
| Premium | $300 | 900 | Within 1 business day |

Premium critical production incidents have a 4-business-hour response target during business hours. These are response targets, not resolution guarantees. Extra minutes require client approval at $30/hour ($0.50/minute).

The default agreement duration is one calendar month. Custom plans can run 1–12 months paid in advance at the listed monthly rate; allocations still release and expire monthly, with no rollover. Future allocations cannot be spent early. Month boundaries retain the original day where possible and clamp month ends (January 31 → February 28/29). New agreements cannot overlap an existing active agreement; requested plan changes activate after the current agreement expires. Extra purchased minutes do not expire unless an expiry is explicitly entered.

Plan descriptions, prices, allocations, duration and response targets can be edited in the catalog. Substantial new development requires a separate quote. The client portal presents the support terms and records acceptance on plan requests; the admin confirms acceptance on direct activation.

## Gmail email delivery

Set these server-side environment values:

```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-account@gmail.com
SMTP_PASSWORD=your-google-app-password
SMTP_FROM=your-account@gmail.com
SUPPORT_EMAIL=your-account@gmail.com
```

Enable 2-Step Verification and create a Google App Password; use that credential, not your usual Google password. See [Google's App Password instructions](https://support.google.com/mail/answer/185833?hl=en). Do not place SMTP credentials in frontend variables or Git.

Support requests are always saved in SQLite. When email is configured, notifications are queued to SUPPORT_EMAIL. Public password-reset requests return a generic response and queue an email for existing accounts. The worker retries with backoff, up to eight attempts, and exposes status to admins. Expired reset messages are not delivered. Email bodies are cleared after successful delivery. This is outbound notification, not automatic Gmail inbox synchronization: reply to the client directly by email, and record any portal decision in the admin inbox.

## External payment details

Use **Settings → Private payment instructions** to supply the Whish number, OMT collection instructions, or bank beneficiary and IBAN you want clients to use. Include currency, transfer reference format and how clients should report their transfer. These instructions require sign-in and are not rendered on the public homepage. There is no need to add these details to build or run the app. Never put banking passwords, PINs or access credentials there.

## Production operations

- Run one application instance on a host with persistent local storage for `SQLITE_PATH` and `UPLOAD_DIR`. SQLite WAL is unsuitable for a shared network filesystem or ephemeral/serverless replicas. See [SQLite WAL documentation](https://www.sqlite.org/wal.html).
- Set `APP_ENV=production`, an HTTPS `PUBLIC_URL`, real bootstrap credentials and SMTP configuration. Build with `npm ci && npm run build` in `client/`; run the compiled Go binary from the repository root, or set absolute file paths.
- Terminate HTTPS at your reverse proxy and forward the frontend and API under one origin. Set suitable upload limits and restrict direct access to the API port. Do not serve the database, uploads directory or environment files publicly.
- Back up SQLite with the SQLite backup API / CLI `.backup` command while running, or stop the application before copying the database. Do not copy only a live WAL database file. Back up private uploads together with the database and verify restores.
- Sessions are opaque, hashed at rest, HttpOnly and SameSite Strict, and Secure under HTTPS. Sessions expire in eight hours. Logout deletes the session; password resets revoke all sessions. Reset tokens are hashed, expire after one hour, and work once.
- Authentication is rate-limited by remote address in memory. Configure reverse-proxy limits too, particularly behind a proxy or if deploying multiple processes.
- Financial mutations use transactions and an audit log. SQLite enforces foreign keys; writes are serialized and use a busy timeout. Unhandled database errors return a generic error and are logged server-side.
- Review actual portfolio case studies and the public contact email in `client/src/pages/Home.tsx` before publishing. Existing illustrative projects are explicitly labeled as concepts with fictional clients.

## Structure

- `cmd/api`: configuration, startup, graceful shutdown.
- `internal/config`: environment loading and validation.
- `internal/database`: SQLite connection and versioned, transactional SQL migrations.
- `internal/repository/sqlite`: users and bootstrap persistence.
- `internal/portal`: routes, session/reset security, workspace reads, per-resource handlers, transactional accounting, private uploads and SMTP outbox.
- `client/src/lib`: typed API client and shared data contracts.
- `client/src/context`: authenticated account and workspace state.
- `client/src/components`: reusable forms, panels and visual components.
- `client/src/pages`: public portfolio, client workspace and admin views.

All SQL values are parameterized. Client workspace queries scope projects, tasks, comments, attachments, requests and minutes to the authenticated account. Admin-only routes enforce the role on the server. Avoid putting authorization rules only in React.

## Verification

```text
go test ./...
go vet ./...
cd client
npm run typecheck
npm run build
npm run test:e2e
```

Use npm with the committed package-lock.json for the verified dependency tree. The pnpm lockfile is also synchronized for the retained Figma development scripts.

Browser tests start an isolated API/database and Vite server, use the installed Chrome browser, and exercise admin account creation and client login. Go integration tests cover authorization, isolation, project halt visibility, accounting, concurrent debits, duplicate approvals, reset expiry/single use, logout and session revocation. No test sends live email or charges money.

## Existing database data

MongoDB code, dependencies and environment keys have been removed. No existing remote database was contacted and no live MongoDB records were imported or deleted. If you have historical users/projects to preserve, export those records and write a reviewed import into this schema before switching production traffic. Do not point a production deployment at an empty database expecting remote data to appear automatically.
