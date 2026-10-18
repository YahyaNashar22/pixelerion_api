package portal

import (
	"crypto/rand"
	"github.com/YahyaNashar22/pixelerion_api/internal/httpx"
	"golang.org/x/crypto/bcrypt"
	"net/http"
	"net/mail"
	"strings"
	"time"
)

type clientInput struct {
	Username        string `json:"username"`
	Email           string `json:"email"`
	Password        string `json:"password"`
	BusinessName    string `json:"business_name"`
	BusinessDetails string `json:"business_details"`
}

func (a *API) createClient(w http.ResponseWriter, r *http.Request) {
	var in clientInput
	if !decode(w, r, &in) {
		return
	}
	in.Username = strings.ToLower(strings.TrimSpace(in.Username))
	in.Email = strings.ToLower(strings.TrimSpace(in.Email))
	address, err := mail.ParseAddress(in.Email)
	if !validText(in.Username, 80) || len(in.Username) < 3 || strings.ContainsAny(in.Username, " @\r\n") || err != nil || address.Address != in.Email || len(in.Password) < 12 || len(in.Password) > 72 || len(in.BusinessName) > 200 || len(in.BusinessDetails) > 5000 {
		writeProblem(w, 400, "Provide a username, valid email, 12-72 byte password and business details")
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		a.fail(w, err)
		return
	}
	id := rand.Text()
	a.write(w, r, "client.create", id, `INSERT INTO users(id,username,email,password_hash,role,business_name,business_details,created_at,updated_at) VALUES(?,?,?,?,'CLIENT',?,?,?,?)`, id, in.Username, in.Email, string(hash), in.BusinessName, in.BusinessDetails, stamp(), stamp())
}
func (a *API) updateClient(w http.ResponseWriter, r *http.Request) {
	var in struct {
		BusinessName    string `json:"business_name"`
		BusinessDetails string `json:"business_details"`
	}
	if !decode(w, r, &in) {
		return
	}
	if len(in.BusinessName) > 200 || len(in.BusinessDetails) > 5000 {
		writeProblem(w, 400, "Business details are too long")
		return
	}
	a.write(w, r, "client.update", r.PathValue("id"), "UPDATE users SET business_name=?,business_details=?,updated_at=? WHERE id=? AND role='CLIENT'", in.BusinessName, in.BusinessDetails, stamp(), r.PathValue("id"))
}
func (a *API) minutes(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Minutes     int    `json:"minutes"`
		Description string `json:"description"`
		ExpiresAt   string `json:"expires_at"`
	}
	if !decode(w, r, &in) {
		return
	}
	if in.Minutes == 0 || in.Minutes > 100000 || in.Minutes < -100000 || !validText(in.Description, 2000) {
		writeProblem(w, 400, "Provide nonzero minutes and an explanation")
		return
	}
	if in.ExpiresAt != "" {
		t, err := time.Parse(time.RFC3339, in.ExpiresAt)
		if err != nil || !t.After(time.Now()) {
			writeProblem(w, 400, "Expiry must be a future RFC3339 timestamp")
			return
		}
		in.ExpiresAt = t.UTC().Format(time.RFC3339)
	}
	if err := a.store.AddMinutes(r.Context(), r.PathValue("id"), who(r).ID, in.Description, in.Minutes, in.ExpiresAt); err != nil {
		a.fail(w, err)
		return
	}
	httpx.WriteJSON(w, 201, Record{"ok": true})
}
func (a *API) subscription(w http.ResponseWriter, r *http.Request) {
	var in struct {
		PlanID           string `json:"plan_id"`
		PaymentReference string `json:"payment_reference"`
		TermsAccepted    bool   `json:"terms_accepted"`
	}
	if !decode(w, r, &in) {
		return
	}
	if !in.TermsAccepted || !validText(in.PaymentReference, 500) || !a.clientExists(r, r.PathValue("id")) {
		writeProblem(w, 400, "Confirm the client's accepted terms and external payment reference")
		return
	}
	if err := a.store.ActivatePlan(r.Context(), r.PathValue("id"), who(r).ID, in.PlanID, in.PaymentReference); err != nil {
		a.fail(w, err)
		return
	}
	httpx.WriteJSON(w, 201, Record{"ok": true})
}
