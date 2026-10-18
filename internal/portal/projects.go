package portal

import (
	"crypto/rand"
	"net/http"
)

type projectInput struct {
	ClientID    string `json:"client_id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Status      string `json:"status"`
	HaltReason  string `json:"halt_reason"`
}

func (a *API) createProject(w http.ResponseWriter, r *http.Request) {
	var in projectInput
	if !decode(w, r, &in) {
		return
	}
	if !validText(in.Title, 200) || len(in.Description) > 10000 || !a.clientExists(r, in.ClientID) {
		writeProblem(w, 400, "Provide a title, description and valid client")
		return
	}
	id := rand.Text()
	a.write(w, r, "project.create", id, "INSERT INTO projects(id,client_id,title,description,created_at) VALUES(?,?,?,?,?)", id, in.ClientID, in.Title, in.Description, stamp())
}
func (a *API) updateProject(w http.ResponseWriter, r *http.Request) {
	var in projectInput
	if !decode(w, r, &in) {
		return
	}
	if !validText(in.Title, 200) || len(in.Description) > 10000 || !oneOf(in.Status, "active", "halted", "completed") || len(in.HaltReason) > 2000 || (in.Status == "halted" && !validText(in.HaltReason, 2000)) {
		writeProblem(w, 400, "Provide a title, valid status and reason when halted")
		return
	}
	if in.Status != "halted" {
		in.HaltReason = ""
	}
	a.write(w, r, "project.update", r.PathValue("id"), "UPDATE projects SET title=?,description=?,status=?,halt_reason=? WHERE id=?", in.Title, in.Description, in.Status, in.HaltReason, r.PathValue("id"))
}

type phaseInput struct {
	Title            string `json:"title"`
	DueDate          string `json:"due_date"`
	AmountCents      int    `json:"amount_cents"`
	Currency         string `json:"currency"`
	Status           string `json:"status"`
	PaymentStatus    string `json:"payment_status"`
	PaymentReference string `json:"payment_reference"`
	Position         int    `json:"position"`
}

func validPhase(in phaseInput) bool {
	return validText(in.Title, 200) && validDate(in.DueDate) && in.AmountCents >= 0 && in.AmountCents <= 100000000 && in.Currency == "USD" && oneOf(in.Status, "planned", "in_progress", "completed") && oneOf(in.PaymentStatus, "unpaid", "paid") && len(in.PaymentReference) <= 500 && (in.PaymentStatus != "paid" || validText(in.PaymentReference, 500))
}
func (a *API) createPhase(w http.ResponseWriter, r *http.Request) {
	var in phaseInput
	if !decode(w, r, &in) {
		return
	}
	if !validPhase(in) {
		writeProblem(w, 400, "Provide a title, due date, USD amount, phase status and payment reference if paid")
		return
	}
	id := rand.Text()
	paid := ""
	if in.PaymentStatus == "paid" {
		paid = stamp()
	}
	a.write(w, r, "phase.create", id, `INSERT INTO phases(id,project_id,title,due_date,amount_cents,currency,status,payment_status,payment_reference,paid_at,position) VALUES(?,?,?,?,?,?,?,?,?,?,?)`, id, r.PathValue("id"), in.Title, in.DueDate, in.AmountCents, in.Currency, in.Status, in.PaymentStatus, in.PaymentReference, paid, in.Position)
}
func (a *API) updatePhase(w http.ResponseWriter, r *http.Request) {
	var in phaseInput
	if !decode(w, r, &in) {
		return
	}
	if !validPhase(in) {
		writeProblem(w, 400, "Invalid phase details; paid phases require an external payment reference")
		return
	}
	paid := ""
	if in.PaymentStatus == "paid" {
		paid = stamp()
	} else {
		in.PaymentReference = ""
	}
	a.write(w, r, "phase.update", r.PathValue("id"), `UPDATE phases SET title=?,due_date=?,amount_cents=?,currency=?,status=?,payment_status=?,payment_reference=?,paid_at=CASE WHEN ?='paid' AND paid_at<>'' THEN paid_at ELSE ? END,position=? WHERE id=?`, in.Title, in.DueDate, in.AmountCents, in.Currency, in.Status, in.PaymentStatus, in.PaymentReference, in.PaymentStatus, paid, in.Position, r.PathValue("id"))
}

type taskInput struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Status      string `json:"status"`
	PhaseID     string `json:"phase_id"`
}

func (a *API) saveTask(w http.ResponseWriter, r *http.Request, create bool) {
	var in taskInput
	if !decode(w, r, &in) {
		return
	}
	if !validText(in.Title, 200) || len(in.Description) > 10000 || !oneOf(in.Status, "backlog", "todo", "in_progress", "review", "done") {
		writeProblem(w, 400, "Provide a title and valid task status")
		return
	}
	project := r.PathValue("id")
	if !create {
		if err := a.store.DB.QueryRowContext(r.Context(), "SELECT project_id FROM tasks WHERE id=?", r.PathValue("id")).Scan(&project); err != nil {
			a.fail(w, err)
			return
		}
	}
	var phase any
	if in.PhaseID != "" {
		var n int
		if err := a.store.DB.QueryRowContext(r.Context(), "SELECT count(*) FROM phases WHERE id=? AND project_id=?", in.PhaseID, project).Scan(&n); err != nil {
			a.fail(w, err)
			return
		}
		if n != 1 {
			writeProblem(w, 400, "Phase must belong to the same project")
			return
		}
		phase = in.PhaseID
	}
	if create {
		id := rand.Text()
		a.write(w, r, "task.create", id, "INSERT INTO tasks(id,project_id,phase_id,title,description,status,created_at) VALUES(?,?,?,?,?,?,?)", id, project, phase, in.Title, in.Description, in.Status, stamp())
	} else {
		a.write(w, r, "task.update", r.PathValue("id"), "UPDATE tasks SET phase_id=?,title=?,description=?,status=? WHERE id=?", phase, in.Title, in.Description, in.Status, r.PathValue("id"))
	}
}
func (a *API) createTask(w http.ResponseWriter, r *http.Request) { a.saveTask(w, r, true) }
func (a *API) updateTask(w http.ResponseWriter, r *http.Request) { a.saveTask(w, r, false) }
func (a *API) taskAccess(r *http.Request, id string) bool {
	var client string
	if err := a.store.DB.QueryRowContext(r.Context(), "SELECT p.client_id FROM tasks t JOIN projects p ON p.id=t.project_id WHERE t.id=?", id).Scan(&client); err != nil {
		return false
	}
	return who(r).Role == "ADMIN" || who(r).ID == client
}
func (a *API) comment(w http.ResponseWriter, r *http.Request) {
	if !a.taskAccess(r, r.PathValue("id")) {
		writeProblem(w, 404, "Task not found")
		return
	}
	var in struct {
		Body string `json:"body"`
	}
	if !decode(w, r, &in) {
		return
	}
	if !validText(in.Body, 5000) {
		writeProblem(w, 400, "Write a comment of up to 5000 characters")
		return
	}
	id := rand.Text()
	a.write(w, r, "task.comment", id, "INSERT INTO comments(id,task_id,author_id,body,created_at) VALUES(?,?,?,?,?)", id, r.PathValue("id"), who(r).ID, in.Body, stamp())
}
