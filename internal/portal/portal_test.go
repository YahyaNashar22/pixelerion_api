package portal

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/YahyaNashar22/pixelerion_api/internal/bootstrap"
	"github.com/YahyaNashar22/pixelerion_api/internal/config"
	"github.com/YahyaNashar22/pixelerion_api/internal/database"
	repository "github.com/YahyaNashar22/pixelerion_api/internal/repository/sqlite"
)

const testOrigin = "http://localhost:8443"
const testPassword = "Long-test-password-123"

type fixture struct {
	handler http.Handler
	db      *sql.DB
	admin   *http.Cookie
	t       *testing.T
}

func setup(t *testing.T) *fixture {
	t.Helper()
	db, err := database.Open(context.Background(), ":memory:")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { db.Close() })
	if err = bootstrap.EnsureAdmin(context.Background(), repository.NewUserRepository(db), "admin", "admin@example.com", testPassword); err != nil {
		t.Fatal(err)
	}
	cfg := &config.Config{PublicURL: testOrigin, UploadDir: t.TempDir(), ClientDir: t.TempDir()}
	f := &fixture{handler: New(db, cfg, slog.New(slog.NewTextHandler(io.Discard, nil))), db: db, t: t}
	res, _ := f.call("POST", "/auth/login", Record{"identifier": "admin", "password": testPassword}, nil, 200)
	if len(res.Result().Cookies()) != 1 {
		t.Fatal("no session cookie")
	}
	f.admin = res.Result().Cookies()[0]
	if !f.admin.HttpOnly || f.admin.SameSite != http.SameSiteStrictMode {
		t.Fatal("cookie protections missing")
	}
	return f
}
func (f *fixture) call(method, path string, body any, cookie *http.Cookie, want int) (*httptest.ResponseRecorder, Record) {
	f.t.Helper()
	var encoded []byte
	if body != nil {
		encoded, _ = json.Marshal(body)
	}
	req := httptest.NewRequest(method, "/api/v1"+path, bytes.NewReader(encoded))
	req.Header.Set("Origin", testOrigin)
	req.Header.Set("Content-Type", "application/json")
	if cookie != nil {
		req.AddCookie(cookie)
	}
	res := httptest.NewRecorder()
	f.handler.ServeHTTP(res, req)
	if res.Code != want {
		f.t.Fatalf("%s %s status %d, want %d: %s", method, path, res.Code, want, res.Body.String())
	}
	out := Record{}
	_ = json.Unmarshal(res.Body.Bytes(), &out)
	return res, out
}
func (f *fixture) client(name string) (string, *http.Cookie) {
	f.t.Helper()
	_, out := f.call("POST", "/admin/clients", Record{"username": name, "email": name + "@example.com", "password": testPassword, "business_name": name + " Co"}, f.admin, 200)
	res, _ := f.call("POST", "/auth/login", Record{"identifier": name, "password": testPassword}, nil, 200)
	return out["id"].(string), res.Result().Cookies()[0]
}
func TestClientIsolationAndProjectWorkflow(t *testing.T) {
	f := setup(t)
	client, a := f.client("alice")
	_, b := f.client("bob")
	f.call("POST", "/admin/clients", Record{}, a, 403)
	f.call("GET", "/workspace", nil, nil, 401)
	_, p := f.call("POST", "/admin/projects", Record{"client_id": client, "title": "Client project", "description": "Private work"}, f.admin, 200)
	project := p["id"].(string)
	_, task := f.call("POST", "/admin/projects/"+project+"/tasks", Record{"title": "Private task", "description": "Details", "status": "todo", "phase_id": ""}, f.admin, 200)
	taskID := task["id"].(string)
	f.call("POST", "/tasks/"+taskID+"/comments", Record{"body": "Progress please"}, a, 200)
	f.call("POST", "/tasks/"+taskID+"/comments", Record{"body": "Unauthorized comment"}, b, 404)
	_, out := f.call("GET", "/workspace?client_id="+client, nil, b, 200)
	if len(out["projects"].([]any)) != 0 || len(out["comments"].([]any)) != 0 {
		t.Fatal("cross-client data exposed")
	}
	f.call("PATCH", "/admin/projects/"+project, Record{"title": "Client project", "description": "Private work", "status": "halted", "halt_reason": "Awaiting phase payment"}, f.admin, 200)
	_, out = f.call("GET", "/workspace", nil, a, 200)
	projects := out["projects"].([]any)
	if projects[0].(map[string]any)["halt_reason"] != "Awaiting phase payment" {
		t.Fatal("halt reason missing")
	}
	_, phase := f.call("POST", "/admin/projects/"+project+"/phases", Record{"title": "Phase 1", "due_date": "2026-11-01", "amount_cents": 25000, "currency": "USD", "status": "completed", "payment_status": "unpaid", "position": 1}, f.admin, 200)
	f.call("PATCH", "/admin/phases/"+phase["id"].(string), Record{"title": "Phase 1", "due_date": "2026-11-01", "amount_cents": 25000, "currency": "USD", "status": "completed", "payment_status": "paid", "payment_reference": ""}, f.admin, 400)
	f.call("POST", "/admin/projects/"+project+"/tasks", Record{"title": "Wrong phase", "status": "todo", "phase_id": "missing"}, f.admin, 400)
	req := httptest.NewRequest("POST", "/api/v1/auth/login", strings.NewReader("{}"))
	req.Header.Set("Origin", "https://evil.example")
	req.Header.Set("Content-Type", "application/json")
	res := httptest.NewRecorder()
	f.handler.ServeHTTP(res, req)
	if res.Code != 403 {
		t.Fatal("cross-origin request accepted")
	}
	f.call("POST", "/auth/logout", Record{}, a, 200)
	f.call("GET", "/me", nil, a, 401)
}
func TestMinuteAccountingAndApprovalIsAtomic(t *testing.T) {
	f := setup(t)
	client, cookie := f.client("alice")
	f.call("POST", "/admin/clients/"+client+"/subscription", Record{"plan_id": "standard", "payment_reference": "Whish transfer 123", "terms_accepted": true}, f.admin, 201)
	f.call("POST", "/admin/clients/"+client+"/subscription", Record{"plan_id": "premium", "payment_reference": "123", "terms_accepted": true}, f.admin, 409)
	f.call("POST", "/admin/clients/"+client+"/minutes", Record{"minutes": -45, "description": "Investigate production error"}, f.admin, 201)
	f.call("POST", "/admin/clients/"+client+"/minutes", Record{"minutes": -136, "description": "Too much"}, f.admin, 409)
	_, out := f.call("GET", "/workspace", nil, cookie, 200)
	if out["balance_minutes"] != float64(135) {
		t.Fatalf("balance %v", out["balance_minutes"])
	}
	_, request := f.call("POST", "/requests", Record{"kind": "minutes", "title": "Extra support", "body": "I approve extra work", "minutes": 60, "terms_accepted": true}, cookie, 201)
	id := request["id"].(string)
	f.call("PATCH", "/admin/requests/"+id, Record{"status": "approved"}, f.admin, 400)
	f.call("PATCH", "/admin/requests/"+id, Record{"status": "approved", "payment_reference": "OMT 456"}, f.admin, 200)
	f.call("PATCH", "/admin/requests/"+id, Record{"status": "approved", "payment_reference": "OMT 456"}, f.admin, 409)
	_, out = f.call("GET", "/workspace", nil, cookie, 200)
	if out["balance_minutes"] != float64(195) {
		t.Fatal("duplicate approval credited minutes")
	}
	// Expire the monthly allocation and its work deductions together. Paid extra minutes remain.
	_, err := f.db.Exec("UPDATE minute_ledger SET expires_at='2000-01-01T00:00:00Z' WHERE user_id=? AND expires_at<>''", client)
	if err != nil {
		t.Fatal(err)
	}
	_, out = f.call("GET", "/workspace", nil, cookie, 200)
	if out["balance_minutes"] != float64(60) {
		t.Fatal("expired allocation contributed to balance")
	}
	// Two concurrent debits cannot both consume the final 60 minutes.
	s := &Store{f.db}
	var actor string
	f.db.QueryRow("SELECT id FROM users WHERE role='ADMIN'").Scan(&actor)
	var wg sync.WaitGroup
	results := make(chan error, 2)
	for range 2 {
		wg.Add(1)
		go func() {
			defer wg.Done()
			results <- s.AddMinutes(context.Background(), client, actor, "Concurrent work", -45, "")
		}()
	}
	wg.Wait()
	close(results)
	success := 0
	for err := range results {
		if err == nil {
			success++
		} else if err != errBalance {
			t.Fatal(err)
		}
	}
	if success != 1 {
		t.Fatal("overspent concurrently")
	}
}
func TestPasswordResetSingleUseAndSessionRevocation(t *testing.T) {
	f := setup(t)
	client, cookie := f.client("alice")
	_, out := f.call("POST", "/admin/clients/"+client+"/reset-link", Record{}, f.admin, 201)
	token := strings.Split(out["url"].(string), "#token=")[1]
	f.call("POST", "/auth/reset-password", Record{"token": token, "password": "short"}, nil, 400)
	f.call("POST", "/auth/reset-password", Record{"token": token, "password": "Replacement-password-456"}, nil, 200)
	f.call("GET", "/me", nil, cookie, 401)
	f.call("POST", "/auth/reset-password", Record{"token": token, "password": "Replacement-password-456"}, nil, 400)
	f.call("POST", "/auth/login", Record{"identifier": "alice", "password": testPassword}, nil, 401)
	f.call("POST", "/auth/login", Record{"identifier": "alice", "password": "Replacement-password-456"}, nil, 200)
	_, out = f.call("POST", "/admin/clients/"+client+"/reset-link", Record{}, f.admin, 201)
	token = strings.Split(out["url"].(string), "#token=")[1]
	if _, err := f.db.Exec("UPDATE password_resets SET expires_at='2000-01-01T00:00:00Z'"); err != nil {
		t.Fatal(err)
	}
	f.call("POST", "/auth/reset-password", Record{"token": token, "password": "Replacement-password-789"}, nil, 400)
	_, known := f.call("POST", "/auth/forgot-password", Record{"email": "alice@example.com"}, nil, 200)
	_, unknown := f.call("POST", "/auth/forgot-password", Record{"email": "missing@example.com"}, nil, 200)
	if known["message"] != unknown["message"] {
		t.Fatal("account existence exposed")
	}
}
func TestCalendarMonthClampsEndOfMonth(t *testing.T) {
	for _, example := range []struct{ start, want string }{{"2026-01-31", "2026-02-28"}, {"2028-01-31", "2028-02-29"}, {"2026-12-31", "2027-01-31"}} {
		start, _ := time.Parse("2006-01-02", example.start)
		if got := calendarMonth(start).Format("2006-01-02"); got != example.want {
			t.Fatalf("got %s want %s", got, example.want)
		}
	}
}
