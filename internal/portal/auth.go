package portal

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/YahyaNashar22/pixelerion_api/internal/httpx"
	"golang.org/x/crypto/bcrypt"
)

type identityKey struct{}
type Identity struct{ ID, Role string }

func who(r *http.Request) Identity { return r.Context().Value(identityKey{}).(Identity) }
func digest(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}
func (a *API) initAuth() {
	a.dummyHash, _ = bcrypt.GenerateFromPassword([]byte(rand.Text()), bcrypt.DefaultCost)
}
func (a *API) secure(admin bool, next http.HandlerFunc) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		c, err := r.Cookie("px_session")
		if err != nil {
			writeProblem(w, 401, "Please sign in")
			return
		}
		var u Identity
		err = a.store.DB.QueryRowContext(r.Context(), `SELECT u.id,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?`, digest(c.Value), stamp()).Scan(&u.ID, &u.Role)
		if err == sql.ErrNoRows {
			writeProblem(w, 401, "Session expired. Please sign in")
			return
		}
		if err != nil {
			a.fail(w, err)
			return
		}
		if admin && u.Role != "ADMIN" {
			writeProblem(w, 403, "Administrator access required")
			return
		}
		next(w, r.WithContext(context.WithValue(r.Context(), identityKey{}, u)))
	})
}
func (a *API) authRate(w http.ResponseWriter, r *http.Request, scope string, limit int) bool {
	host, _, _ := net.SplitHostPort(r.RemoteAddr)
	if !a.limiter.allow(scope+":"+host, limit) {
		w.Header().Set("Retry-After", "900")
		writeProblem(w, 429, "Too many attempts. Please try again in 15 minutes")
		return false
	}
	return true
}
func (a *API) cookie(w http.ResponseWriter, value string, age int) {
	http.SetCookie(w, &http.Cookie{Name: "px_session", Value: value, Path: "/", MaxAge: age, HttpOnly: true, Secure: strings.HasPrefix(a.cfg.PublicURL, "https://"), SameSite: http.SameSiteStrictMode})
}
func (a *API) login(w http.ResponseWriter, r *http.Request) {
	if !a.authRate(w, r, "login", 20) {
		return
	}
	var in struct {
		Identifier string `json:"identifier"`
		Password   string `json:"password"`
	}
	if !decode(w, r, &in) {
		return
	}
	if len(in.Password) > 72 {
		writeProblem(w, 401, "Invalid credentials")
		return
	}
	var id, hash string
	err := a.store.DB.QueryRowContext(r.Context(), "SELECT id,password_hash FROM users WHERE username=? OR email=?", strings.TrimSpace(in.Identifier), strings.TrimSpace(in.Identifier)).Scan(&id, &hash)
	if err != nil && err != sql.ErrNoRows {
		a.fail(w, err)
		return
	}
	check := []byte(hash)
	if err == sql.ErrNoRows {
		check = a.dummyHash
	}
	mismatch := bcrypt.CompareHashAndPassword(check, []byte(in.Password))
	if err != nil || mismatch != nil {
		writeProblem(w, 401, "Invalid credentials")
		return
	}
	token := rand.Text()
	err = a.store.transaction(r.Context(), func(tx *sql.Tx) error {
		// Rotate the session presented by this browser.
		if c, e := r.Cookie("px_session"); e == nil {
			if _, e = tx.ExecContext(r.Context(), "DELETE FROM sessions WHERE token_hash=?", digest(c.Value)); e != nil {
				return e
			}
		}
		if _, e := tx.ExecContext(r.Context(), "DELETE FROM sessions WHERE expires_at<=?", stamp()); e != nil {
			return e
		}
		_, e := tx.ExecContext(r.Context(), "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)", digest(token), id, time.Now().UTC().Add(8*time.Hour).Format(time.RFC3339))
		return e
	})
	if err != nil {
		a.fail(w, err)
		return
	}
	a.cookie(w, token, 8*3600)
	user, err := query(r.Context(), a.store.DB, "SELECT id,username,email,role,business_name,business_details FROM users WHERE id=?", id)
	if err != nil {
		a.fail(w, err)
		return
	}
	httpx.WriteJSON(w, 200, user[0])
}
func (a *API) logout(w http.ResponseWriter, r *http.Request) {
	c, _ := r.Cookie("px_session")
	if _, err := a.store.DB.ExecContext(r.Context(), "DELETE FROM sessions WHERE token_hash=?", digest(c.Value)); err != nil {
		a.fail(w, err)
		return
	}
	a.cookie(w, "", -1)
	httpx.WriteJSON(w, 200, Record{"ok": true})
}
func (a *API) me(w http.ResponseWriter, r *http.Request) {
	rows, err := query(r.Context(), a.store.DB, "SELECT id,username,email,role,business_name,business_details FROM users WHERE id=?", who(r).ID)
	if err != nil {
		a.fail(w, err)
		return
	}
	httpx.WriteJSON(w, 200, rows[0])
}
func (a *API) makeReset(ctx context.Context, user string, send bool) (string, error) {
	token := rand.Text()
	link := a.cfg.PublicURL + "/portal/reset-password#token=" + token
	err := a.store.transaction(ctx, func(tx *sql.Tx) error {
		var email string
		if err := tx.QueryRowContext(ctx, "SELECT email FROM users WHERE id=?", user).Scan(&email); err != nil {
			return err
		}
		if _, err := tx.ExecContext(ctx, "DELETE FROM password_resets WHERE user_id=? OR expires_at<=?", user, stamp()); err != nil {
			return err
		}
		if _, err := tx.ExecContext(ctx, "INSERT INTO password_resets(token_hash,user_id,expires_at) VALUES(?,?,?)", digest(token), user, time.Now().UTC().Add(time.Hour).Format(time.RFC3339)); err != nil {
			return err
		}
		if send {
			return enqueue(ctx, tx, email, "Reset your Pixelerion password", "Use this link within one hour:\n\n"+link+"\n\nIf you did not request this, you can ignore this message.", time.Now().UTC().Add(time.Hour).Format(time.RFC3339))
		}
		return nil
	})
	return link, err
}
func (a *API) forgotPassword(w http.ResponseWriter, r *http.Request) {
	if !a.authRate(w, r, "forgot", 5) {
		return
	}
	var in struct {
		Email string `json:"email"`
	}
	if !decode(w, r, &in) {
		return
	}
	var id string
	err := a.store.DB.QueryRowContext(r.Context(), "SELECT id FROM users WHERE email=?", strings.TrimSpace(in.Email)).Scan(&id)
	if err == nil {
		_, err = a.makeReset(r.Context(), id, true)
	}
	if err != nil && err != sql.ErrNoRows {
		a.fail(w, err)
		return
	}
	httpx.WriteJSON(w, 200, Record{"message": "If an account exists, a reset email will be sent. You can also ask Pixelerion for a reset link."})
}
func (a *API) adminReset(w http.ResponseWriter, r *http.Request) {
	if !a.authRate(w, r, "admin-reset", 30) {
		return
	}
	link, err := a.makeReset(r.Context(), r.PathValue("id"), false)
	if err != nil {
		a.fail(w, err)
		return
	}
	_, err = a.store.DB.ExecContext(r.Context(), "INSERT INTO audit_log(actor_id,action,resource_id,created_at) VALUES(?,'password.reset_link',?,?)", who(r).ID, r.PathValue("id"), stamp())
	if err != nil {
		a.fail(w, err)
		return
	}
	httpx.WriteJSON(w, 201, Record{"url": link, "expires_in_seconds": 3600})
}
func (a *API) resetPassword(w http.ResponseWriter, r *http.Request) {
	if !a.authRate(w, r, "reset", 10) {
		return
	}
	var in struct {
		Token    string `json:"token"`
		Password string `json:"password"`
	}
	if !decode(w, r, &in) {
		return
	}
	if len(in.Password) < 12 || len(in.Password) > 72 {
		writeProblem(w, 400, "Use a password of 12-72 bytes")
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		a.fail(w, err)
		return
	}
	err = a.store.transaction(r.Context(), func(tx *sql.Tx) error {
		var id string
		if err := tx.QueryRowContext(r.Context(), "SELECT user_id FROM password_resets WHERE token_hash=? AND expires_at>?", digest(in.Token), stamp()).Scan(&id); err != nil {
			return err
		}
		if _, err := tx.ExecContext(r.Context(), "UPDATE users SET password_hash=?,updated_at=? WHERE id=?", string(hash), stamp(), id); err != nil {
			return err
		}
		if _, err := tx.ExecContext(r.Context(), "DELETE FROM sessions WHERE user_id=?", id); err != nil {
			return err
		}
		_, err := tx.ExecContext(r.Context(), "DELETE FROM password_resets WHERE user_id=?", id)
		return err
	})
	if err == sql.ErrNoRows {
		writeProblem(w, 400, "This reset link is invalid or expired")
		return
	}
	if err != nil {
		a.fail(w, err)
		return
	}
	a.cookie(w, "", -1)
	httpx.WriteJSON(w, 200, Record{"message": "Password updated. Please sign in."})
}
