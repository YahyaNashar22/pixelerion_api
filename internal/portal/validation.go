package portal

import (
	"database/sql"
	"github.com/YahyaNashar22/pixelerion_api/internal/httpx"
	"net/http"
	"strings"
	"time"
)

func validText(v string, max int) bool { return strings.TrimSpace(v) != "" && len(v) <= max }
func oneOf(v string, values ...string) bool {
	for _, s := range values {
		if s == v {
			return true
		}
	}
	return false
}
func validDate(v string) bool { _, err := time.Parse("2006-01-02", v); return err == nil }
func (a *API) clientExists(r *http.Request, id string) bool {
	var n int
	err := a.store.DB.QueryRowContext(r.Context(), "SELECT count(*) FROM users WHERE id=? AND role='CLIENT'", id).Scan(&n)
	return err == nil && n == 1
}
func (a *API) write(w http.ResponseWriter, r *http.Request, action, id, statement string, args ...any) {
	err := a.store.transaction(r.Context(), func(tx *sql.Tx) error {
		result, err := tx.ExecContext(r.Context(), statement, args...)
		if err != nil {
			return err
		}
		n, err := result.RowsAffected()
		if err != nil {
			return err
		}
		if n == 0 {
			return errMissing
		}
		return audit(r.Context(), tx, who(r).ID, action, id)
	})
	if err != nil {
		a.fail(w, err)
		return
	}
	httpx.WriteJSON(w, 200, Record{"id": id, "ok": true})
}
