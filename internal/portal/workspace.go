package portal

import (
	"database/sql"
	"github.com/YahyaNashar22/pixelerion_api/internal/httpx"
	"net/http"
)

func (a *API) plans(w http.ResponseWriter, r *http.Request) {
	rows, err := query(r.Context(), a.store.DB, "SELECT * FROM plans WHERE active=1 ORDER BY price_cents")
	if err != nil {
		a.fail(w, err)
		return
	}
	httpx.WriteJSON(w, 200, rows)
}
func (a *API) workspace(w http.ResponseWriter, r *http.Request) {
	u := who(r)
	admin := u.Role == "ADMIN"
	client := u.ID
	if admin {
		client = r.URL.Query().Get("client_id")
	}
	out := Record{}
	ctx := r.Context()
	// One read transaction gives the dashboard a consistent financial snapshot.
	tx, err := a.store.DB.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		a.fail(w, err)
		return
	}
	defer tx.Rollback()
	queries := []struct {
		key, sql string
		args     []any
	}{
		{"plans", "SELECT * FROM plans ORDER BY price_cents", nil},
		{"projects", "SELECT * FROM projects WHERE client_id=? ORDER BY created_at DESC", []any{client}},
		{"phases", `SELECT f.* FROM phases f JOIN projects p ON p.id=f.project_id WHERE p.client_id=? ORDER BY f.position,f.due_date`, []any{client}},
		{"tasks", `SELECT t.* FROM tasks t JOIN projects p ON p.id=t.project_id WHERE p.client_id=? ORDER BY t.created_at`, []any{client}},
		{"comments", `SELECT c.*,u.username AS author FROM comments c JOIN users u ON u.id=c.author_id JOIN tasks t ON t.id=c.task_id JOIN projects p ON p.id=t.project_id WHERE p.client_id=? ORDER BY c.created_at`, []any{client}},
		{"attachments", `SELECT f.* FROM attachments f JOIN tasks t ON t.id=f.task_id JOIN projects p ON p.id=t.project_id WHERE p.client_id=? ORDER BY f.created_at`, []any{client}},
		{"ledger", "SELECT * FROM minute_ledger WHERE user_id=? ORDER BY created_at DESC,rowid DESC", []any{client}},
		{"subscriptions", "SELECT * FROM subscriptions WHERE user_id=? ORDER BY starts_at DESC", []any{client}},
		{"requests", "SELECT r.*,u.username FROM requests r JOIN users u ON u.id=r.client_id WHERE r.client_id=? ORDER BY r.created_at DESC", []any{client}},
	}
	if admin {
		queries = append(queries, struct {
			key, sql string
			args     []any
		}{"clients", "SELECT id,username,email,role,business_name,business_details,created_at FROM users WHERE role='CLIENT' ORDER BY username", nil})
		queries = append(queries, struct {
			key, sql string
			args     []any
		}{"audit", "SELECT a.*,u.username FROM audit_log a JOIN users u ON u.id=a.actor_id ORDER BY a.id DESC LIMIT 100", nil})
		queries = append(queries, struct {
			key, sql string
			args     []any
		}{"email_queue", "SELECT id,recipient,subject,attempts,sent_at,last_error,expires_at FROM email_outbox ORDER BY rowid DESC LIMIT 50", nil})
		if client == "" {
			queries[8].sql = "SELECT r.*,u.username FROM requests r JOIN users u ON u.id=r.client_id ORDER BY r.created_at DESC"
			queries[8].args = nil
		}
	}
	for _, q := range queries {
		rows, err := query(ctx, tx, q.sql, q.args...)
		if err != nil {
			a.fail(w, err)
			return
		}
		out[q.key] = rows
	}
	var balance int
	err = tx.QueryRowContext(ctx, "SELECT COALESCE(SUM(minutes),0) FROM minute_ledger WHERE user_id=? AND (expires_at='' OR expires_at>?) AND available_at<=?", client, stamp(), stamp()).Scan(&balance)
	if err != nil {
		a.fail(w, err)
		return
	}
	out["balance_minutes"] = balance
	var instructions string
	if err = tx.QueryRowContext(ctx, "SELECT value FROM settings WHERE key='payment_instructions'").Scan(&instructions); err != nil {
		a.fail(w, err)
		return
	}
	out["payment_instructions"] = instructions
	out["email_configured"] = a.cfg.SMTP.Username != ""
	if err = tx.Commit(); err != nil {
		a.fail(w, err)
		return
	}
	httpx.WriteJSON(w, 200, out)
}
