package portal

import (
	"crypto/rand"
	"database/sql"
	"github.com/YahyaNashar22/pixelerion_api/internal/httpx"
	"net/http"
)

func (a *API) createRequest(w http.ResponseWriter, r *http.Request) {
	if who(r).Role != "CLIENT" {
		writeProblem(w, 403, "Select and manage requests from the admin workspace")
		return
	}
	if !a.authRate(w, r, "requests-"+who(r).ID, 30) {
		return
	}
	var in struct {
		Kind          string `json:"kind"`
		Title         string `json:"title"`
		Body          string `json:"body"`
		PlanID        string `json:"plan_id"`
		Minutes       int    `json:"minutes"`
		TermsAccepted bool   `json:"terms_accepted"`
	}
	if !decode(w, r, &in) {
		return
	}
	if !oneOf(in.Kind, "support", "plan_change", "minutes", "cancellation") || !validText(in.Title, 200) || !validText(in.Body, 10000) {
		writeProblem(w, 400, "Provide request type, subject and details")
		return
	}
	var plan any
	var quotePrice, quoteMinutes, quoteMonths any
	if in.Kind == "plan_change" {
		var price, minutes, months int
		err := a.store.DB.QueryRowContext(r.Context(), "SELECT price_cents,included_minutes,duration_months FROM plans WHERE id=? AND active=1", in.PlanID).Scan(&price, &minutes, &months)
		if err == sql.ErrNoRows || !in.TermsAccepted {
			writeProblem(w, 400, "Choose an active plan and accept the support terms")
			return
		}
		if err != nil {
			a.fail(w, err)
			return
		}
		quotePrice, quoteMinutes, quoteMonths = price, minutes, months

		plan = in.PlanID
		in.Body += "\n\nClient accepted support terms when submitting."
	}
	if in.Kind == "minutes" {
		if in.Minutes < 1 || in.Minutes > 100000 || !in.TermsAccepted {
			writeProblem(w, 400, "Specify minutes and approve the additional cost of $30/hour")
			return
		}
		in.Body += "\n\nClient approved additional minutes at $30/hour."
	} else {
		in.Minutes = 0
	}
	id := rand.Text()
	err := a.store.transaction(r.Context(), func(tx *sql.Tx) error {
		_, err := tx.ExecContext(r.Context(), "INSERT INTO requests(id,client_id,kind,title,body,plan_id,minutes,created_at,updated_at,quoted_price_cents,quoted_minutes,quoted_months) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)", id, who(r).ID, in.Kind, in.Title, in.Body, plan, in.Minutes, stamp(), stamp(), quotePrice, quoteMinutes, quoteMonths)
		if err != nil {
			return err
		}
		if a.cfg.SMTP.SupportEmail != "" {
			var email string
			if err := tx.QueryRowContext(r.Context(), "SELECT email FROM users WHERE id=?", who(r).ID).Scan(&email); err != nil {
				return err
			}
			if err := enqueue(r.Context(), tx, a.cfg.SMTP.SupportEmail, "Pixelerion request "+id, in.Title+"\n\n"+in.Body+"\n\nClient: "+email+"\nReply to the client directly or review in your admin workspace."); err != nil {
				return err
			}
		}
		return audit(r.Context(), tx, who(r).ID, "request.create", id)
	})
	if err != nil {
		a.fail(w, err)
		return
	}
	httpx.WriteJSON(w, 201, Record{"id": id, "email_queued": a.cfg.SMTP.SupportEmail != ""})
}
func (a *API) decideRequest(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Status           string `json:"status"`
		AdminNote        string `json:"admin_note"`
		PaymentReference string `json:"payment_reference"`
		TermsAccepted    bool   `json:"terms_accepted"`
	}
	if !decode(w, r, &in) {
		return
	}
	if !oneOf(in.Status, "approved", "declined", "resolved") || len(in.AdminNote) > 5000 || len(in.PaymentReference) > 500 {
		writeProblem(w, 400, "Choose approved, declined or resolved")
		return
	}
	if in.Status == "approved" {
		var kind string
		err := a.store.DB.QueryRowContext(r.Context(), "SELECT kind FROM requests WHERE id=?", r.PathValue("id")).Scan(&kind)
		if err != nil {
			a.fail(w, err)
			return
		}
		if (kind == "minutes" || kind == "plan_change") && !validText(in.PaymentReference, 500) {
			writeProblem(w, 400, "Confirm external payment with a reference before approval")
			return
		}
		if kind == "plan_change" && !in.TermsAccepted {
			writeProblem(w, 400, "Confirm the client accepted the terms")
			return
		}
	}
	if err := a.store.DecideRequest(r.Context(), r.PathValue("id"), who(r).ID, in.Status, in.AdminNote, in.PaymentReference, in.TermsAccepted); err != nil {
		a.fail(w, err)
		return
	}
	httpx.WriteJSON(w, 200, Record{"ok": true})
}
func (a *API) settings(w http.ResponseWriter, r *http.Request) {
	var in struct {
		PaymentInstructions string `json:"payment_instructions"`
	}
	if !decode(w, r, &in) {
		return
	}
	if !validText(in.PaymentInstructions, 5000) {
		writeProblem(w, 400, "Provide payment instructions of up to 5000 characters")
		return
	}
	a.write(w, r, "settings.payment_instructions", "payment_instructions", "UPDATE settings SET value=? WHERE key='payment_instructions'", in.PaymentInstructions)
}
