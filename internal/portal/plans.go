package portal

import (
	"crypto/rand"
	"net/http"
)

type planInput struct {
	Name            string `json:"name"`
	Description     string `json:"description"`
	PriceCents      int    `json:"price_cents"`
	IncludedMinutes int    `json:"included_minutes"`
	DurationMonths  int    `json:"duration_months"`
	ResponseTarget  string `json:"response_target"`
	Active          bool   `json:"active"`
}

func (a *API) savePlan(w http.ResponseWriter, r *http.Request) {
	var in planInput
	if !decode(w, r, &in) {
		return
	}
	if !validText(in.Name, 100) || !validText(in.Description, 5000) || in.PriceCents < 0 || in.PriceCents > 100000000 || in.IncludedMinutes < 1 || in.IncludedMinutes > 100000 || (in.DurationMonths < 1 || in.DurationMonths > 12) || !validText(in.ResponseTarget, 500) {
		writeProblem(w, 400, "Provide valid plan details. Duration must be 1-12 months; allocations release monthly")
		return
	}
	id := r.PathValue("id")
	if id == "" {
		id = rand.Text()
		a.write(w, r, "plan.create", id, "INSERT INTO plans(id,name,description,price_cents,included_minutes,duration_months,response_target,active) VALUES(?,?,?,?,?,?,?,?)", id, in.Name, in.Description, in.PriceCents, in.IncludedMinutes, in.DurationMonths, in.ResponseTarget, in.Active)
	} else {
		a.write(w, r, "plan.update", id, "UPDATE plans SET name=?,description=?,price_cents=?,included_minutes=?,duration_months=?,response_target=?,active=? WHERE id=?", in.Name, in.Description, in.PriceCents, in.IncludedMinutes, in.DurationMonths, in.ResponseTarget, in.Active, id)
	}
}
