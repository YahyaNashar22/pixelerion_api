package portal

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/YahyaNashar22/pixelerion_api/internal/config"
	"github.com/YahyaNashar22/pixelerion_api/internal/httpx"
)

type API struct {
	store     *Store
	cfg       *config.Config
	logger    *slog.Logger
	limiter   *rateLimiter
	dummyHash []byte
}

func New(db *sql.DB, cfg *config.Config, logger *slog.Logger) http.Handler {
	a := &API{store: &Store{db}, cfg: cfg, logger: logger, limiter: &rateLimiter{entries: map[string]rateEntry{}}}
	a.initAuth()
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		if err := db.PingContext(r.Context()); err != nil {
			a.fail(w, err)
			return
		}
		httpx.WriteJSON(w, 200, Record{"status": "ok"})
	})
	mux.HandleFunc("GET /api/v1/plans", a.plans)
	mux.HandleFunc("POST /api/v1/auth/login", a.login)
	mux.HandleFunc("POST /api/v1/auth/forgot-password", a.forgotPassword)
	mux.HandleFunc("POST /api/v1/auth/reset-password", a.resetPassword)
	mux.Handle("POST /api/v1/auth/logout", a.secure(false, a.logout))
	mux.Handle("GET /api/v1/me", a.secure(false, a.me))
	mux.Handle("GET /api/v1/workspace", a.secure(false, a.workspace))
	mux.Handle("POST /api/v1/requests", a.secure(false, a.createRequest))
	mux.Handle("POST /api/v1/tasks/{id}/comments", a.secure(false, a.comment))
	mux.Handle("GET /api/v1/attachments/{id}", a.secure(false, a.download))
	mux.Handle("POST /api/v1/admin/clients", a.secure(true, a.createClient))
	mux.Handle("PATCH /api/v1/admin/clients/{id}", a.secure(true, a.updateClient))
	mux.Handle("POST /api/v1/admin/clients/{id}/reset-link", a.secure(true, a.adminReset))
	mux.Handle("POST /api/v1/admin/clients/{id}/minutes", a.secure(true, a.minutes))
	mux.Handle("POST /api/v1/admin/clients/{id}/subscription", a.secure(true, a.subscription))
	mux.Handle("POST /api/v1/admin/projects", a.secure(true, a.createProject))
	mux.Handle("PATCH /api/v1/admin/projects/{id}", a.secure(true, a.updateProject))
	mux.Handle("POST /api/v1/admin/projects/{id}/phases", a.secure(true, a.createPhase))
	mux.Handle("PATCH /api/v1/admin/phases/{id}", a.secure(true, a.updatePhase))
	mux.Handle("POST /api/v1/admin/projects/{id}/tasks", a.secure(true, a.createTask))
	mux.Handle("PATCH /api/v1/admin/tasks/{id}", a.secure(true, a.updateTask))
	mux.Handle("POST /api/v1/admin/tasks/{id}/attachments", a.secure(true, a.upload))
	mux.Handle("POST /api/v1/admin/plans", a.secure(true, a.savePlan))
	mux.Handle("PUT /api/v1/admin/plans/{id}", a.secure(true, a.savePlan))
	mux.Handle("PATCH /api/v1/admin/requests/{id}", a.secure(true, a.decideRequest))
	mux.Handle("PUT /api/v1/admin/settings", a.secure(true, a.settings))
	mux.HandleFunc("/api/", func(w http.ResponseWriter, r *http.Request) { writeProblem(w, 404, "Endpoint not found") })
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			w.Header().Set("Allow", "GET, HEAD")
			writeProblem(w, 405, "Method not allowed")
			return
		}
		a.static(w, r)
	})
	return a.protect(mux)
}
func (a *API) fail(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, sql.ErrNoRows), errors.Is(err, errMissing):
		writeProblem(w, 404, "Record not found")
	case errors.Is(err, errBalance), errors.Is(err, errOverlap), errors.Is(err, errState), errors.Is(err, errQuote):
		writeProblem(w, 409, err.Error())
	default:
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			writeProblem(w, 409, "Username or email already exists")
			return
		}
		a.logger.Error("request failed", "error", err)
		writeProblem(w, 500, "Unable to complete the request")
	}
}
func writeProblem(w http.ResponseWriter, status int, message string) {
	httpx.WriteJSON(w, status, Record{"error": Record{"message": message}})
}
func decode(w http.ResponseWriter, r *http.Request, target any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, 64<<10)
	d := json.NewDecoder(r.Body)
	d.DisallowUnknownFields()
	if err := d.Decode(target); err != nil {
		writeProblem(w, 400, "Invalid request body")
		return false
	}
	if err := d.Decode(&struct{}{}); err != io.EOF {
		writeProblem(w, 400, "Expected one JSON object")
		return false
	}
	return true
}
func (a *API) protect(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Referrer-Policy", "no-referrer")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		if strings.HasPrefix(r.URL.Path, "/api/") {
			w.Header().Set("Cache-Control", "no-store")
		}
		if a.cfg.App.Environment == "production" || a.cfg.App.Environment == "staging" {
			w.Header().Set("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https://images.unsplash.com data:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'")
		}
		if strings.HasPrefix(a.cfg.PublicURL, "https://") {
			w.Header().Set("Strict-Transport-Security", "max-age=31536000")
		}
		// Mutations require an explicit same-origin header, including login and reset.
		if r.Method != "GET" && r.Method != "HEAD" && r.Method != "OPTIONS" {
			if r.Header.Get("Origin") != a.cfg.PublicURL {
				writeProblem(w, 403, "Request origin is not allowed")
				return
			}
			if !strings.HasPrefix(r.Header.Get("Content-Type"), "application/json") && !strings.HasPrefix(r.Header.Get("Content-Type"), "multipart/form-data") {
				writeProblem(w, 415, "Unsupported content type")
				return
			}
		}
		defer func() {
			if v := recover(); v != nil {
				a.logger.Error("panic recovered", "error", fmt.Sprint(v))
				writeProblem(w, 500, "Unable to complete the request")
			}
		}()
		next.ServeHTTP(w, r)
	})
}
func (a *API) static(w http.ResponseWriter, r *http.Request) {
	path := filepath.Clean(strings.TrimPrefix(r.URL.Path, "/"))
	if strings.HasPrefix(path, "..") || strings.Contains(path, ":") || strings.Contains(path, "\\") {
		http.NotFound(w, r)
		return
	}
	target := filepath.Join(a.cfg.ClientDir, path)
	if info, err := os.Stat(target); err == nil && !info.IsDir() {
		http.ServeFile(w, r, target)
		return
	}
	if strings.Contains(filepath.Base(path), ".") {
		http.NotFound(w, r)
		return
	}
	index := filepath.Join(a.cfg.ClientDir, "index.html")
	if _, err := os.Stat(index); err != nil {
		writeProblem(w, 503, "Build the frontend with npm run build in client/")
		return
	}
	http.ServeFile(w, r, index)
}

type rateEntry struct {
	count   int
	expires time.Time
}
type rateLimiter struct {
	mu      sync.Mutex
	entries map[string]rateEntry
}

func (l *rateLimiter) allow(key string, limit int) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := time.Now()
	for k, v := range l.entries {
		if now.After(v.expires) {
			delete(l.entries, k)
		}
	}
	v := l.entries[key]
	if v.expires.IsZero() {
		v.expires = now.Add(15 * time.Minute)
	}
	v.count++
	l.entries[key] = v
	return v.count <= limit
}
