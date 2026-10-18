// Package portal implements the client workspace and administrative workflows.
package portal

import (
	"context"
	"crypto/rand"
	"database/sql"
	"errors"
	"fmt"
	"time"
)

type Store struct{ DB *sql.DB }
type Record = map[string]any
type queryer interface {
	QueryContext(context.Context, string, ...any) (*sql.Rows, error)
}

func query(ctx context.Context, db queryer, statement string, args ...any) ([]Record, error) {
	rows, err := db.QueryContext(ctx, statement, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	columns, err := rows.Columns()
	if err != nil {
		return nil, err
	}
	result := []Record{}
	for rows.Next() {
		values := make([]any, len(columns))
		pointers := make([]any, len(columns))
		for i := range values {
			pointers[i] = &values[i]
		}
		if err := rows.Scan(pointers...); err != nil {
			return nil, err
		}
		record := Record{}
		for i, key := range columns {
			if b, ok := values[i].([]byte); ok {
				record[key] = string(b)
			} else {
				record[key] = values[i]
			}
		}
		result = append(result, record)
	}
	return result, rows.Err()
}
func stamp() string { return time.Now().UTC().Format(time.RFC3339) }
func audit(ctx context.Context, tx *sql.Tx, actor, action, id string) error {
	_, err := tx.ExecContext(ctx, "INSERT INTO audit_log(actor_id,action,resource_id,created_at) VALUES(?,?,?,?)", actor, action, id, stamp())
	return err
}
func (s *Store) transaction(ctx context.Context, fn func(*sql.Tx) error) error {
	tx, err := s.DB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if err = fn(tx); err != nil {
		return err
	}
	return tx.Commit()
}

var errBalance = errors.New("insufficient minute balance")
var errOverlap = errors.New("an active plan already exists; wait for expiry before activating a new period")
var errMissing = errors.New("record not found")
var errQuote = errors.New("the plan changed after this request; ask the client to submit a new request accepting the current plan")
var errState = errors.New("this request has already been processed")

// AddMinutes debits the earliest-expiring allocation first. All entries are append-only.
func addMinutes(ctx context.Context, tx *sql.Tx, user, actor, description string, minutes int, expiry string) error {
	if minutes > 0 {
		_, err := tx.ExecContext(ctx, "INSERT INTO minute_ledger(id,user_id,minutes,description,expires_at,created_at,actor_id) VALUES(?,?,?,?,?,?,?)", rand.Text(), user, minutes, description, expiry, stamp(), actor)
		return err
	}
	groups, err := query(ctx, tx, `SELECT expires_at,SUM(minutes) AS balance FROM minute_ledger WHERE user_id=? AND (expires_at='' OR expires_at>?) AND available_at<=? GROUP BY expires_at HAVING SUM(minutes)>0 ORDER BY CASE WHEN expires_at='' THEN 1 ELSE 0 END,expires_at`, user, stamp(), stamp())
	if err != nil {
		return err
	}
	total := int64(0)
	for _, g := range groups {
		total += g["balance"].(int64)
	}
	if total < int64(-minutes) {
		return errBalance
	}
	remaining := -minutes
	for _, g := range groups {
		amount := min(remaining, int(g["balance"].(int64)))
		if amount == 0 {
			break
		}
		_, err := tx.ExecContext(ctx, "INSERT INTO minute_ledger(id,user_id,minutes,description,expires_at,created_at,actor_id) VALUES(?,?,?,?,?,?,?)", rand.Text(), user, -amount, description, g["expires_at"], stamp(), actor)
		if err != nil {
			return err
		}
		remaining -= amount
	}
	return nil
}
func (s *Store) AddMinutes(ctx context.Context, user, actor, description string, minutes int, expiry string) error {
	return s.transaction(ctx, func(tx *sql.Tx) error {
		var role string
		if err := tx.QueryRowContext(ctx, "SELECT role FROM users WHERE id=?", user).Scan(&role); err != nil {
			return err
		}
		if role != "CLIENT" {
			return errMissing
		}
		if err := addMinutes(ctx, tx, user, actor, description, minutes, expiry); err != nil {
			return err
		}
		return audit(ctx, tx, actor, "minutes.record", user)
	})
}

// ActivatePlan snapshots the agreement. Editing the catalog never changes existing contracts.
func activatePlan(ctx context.Context, tx *sql.Tx, user, actor, plan, reference string) error {
	var count int
	if err := tx.QueryRowContext(ctx, "SELECT count(*) FROM subscriptions WHERE user_id=? AND ends_at>?", user, stamp()).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return errOverlap
	}
	var name string
	var price, minutes, months int
	if err := tx.QueryRowContext(ctx, "SELECT name,price_cents,included_minutes,duration_months FROM plans WHERE id=? AND active=1", plan).Scan(&name, &price, &minutes, &months); err != nil {
		return err
	}
	start := time.Now().UTC()
	end := calendarMonths(start, months)
	id := rand.Text()
	_, err := tx.ExecContext(ctx, "INSERT INTO subscriptions(id,user_id,plan_id,plan_name,price_cents,included_minutes,starts_at,ends_at,payment_reference,terms_accepted,duration_months) VALUES(?,?,?,?,?,?,?,?,?,1,?)", id, user, plan, name, price*months, minutes*months, start.Format(time.RFC3339), end.Format(time.RFC3339), reference, months)
	if err != nil {
		return err
	}
	for month := 0; month < months; month++ {
		available := calendarMonths(start, month).Format(time.RFC3339)
		expiry := calendarMonths(start, month+1).Format(time.RFC3339)
		_, err := tx.ExecContext(ctx, "INSERT INTO minute_ledger(id,user_id,minutes,description,available_at,expires_at,created_at,actor_id) VALUES(?,?,?,?,?,?,?,?)", rand.Text(), user, minutes, name+" monthly allocation", available, expiry, stamp(), actor)
		if err != nil {
			return err
		}
	}

	return audit(ctx, tx, actor, "plan.activate", id)
}

// Clamp the day so January 31 renews on February's last day.
func calendarMonth(t time.Time) time.Time { return calendarMonths(t, 1) }
func calendarMonths(t time.Time, months int) time.Time {
	first := time.Date(t.Year(), t.Month()+time.Month(months), 1, t.Hour(), t.Minute(), t.Second(), 0, time.UTC)
	last := time.Date(first.Year(), first.Month()+1, 0, 0, 0, 0, 0, time.UTC).Day()
	return first.AddDate(0, 0, min(t.Day(), last)-1)
}
func (s *Store) ActivatePlan(ctx context.Context, user, actor, plan, reference string) error {
	return s.transaction(ctx, func(tx *sql.Tx) error { return activatePlan(ctx, tx, user, actor, plan, reference) })
}
func (s *Store) DecideRequest(ctx context.Context, id, actor, status, note, reference string, terms bool) error {
	return s.transaction(ctx, func(tx *sql.Tx) error {
		var user, kind, current string
		var plan sql.NullString
		var minutes int
		err := tx.QueryRowContext(ctx, "SELECT client_id,kind,status,plan_id,minutes FROM requests WHERE id=?", id).Scan(&user, &kind, &current, &plan, &minutes)
		if err != nil {
			return err
		}
		if current != "pending" {
			return errState
		}
		if status == "approved" {
			switch kind {
			case "minutes":
				if reference == "" {
					return fmt.Errorf("external payment reference is required")
				}
				if err := addMinutes(ctx, tx, user, actor, "Approved extra minutes; payment: "+reference, minutes, ""); err != nil {
					return err
				}
			case "plan_change":
				if reference == "" || !terms {
					return fmt.Errorf("confirm external payment and accepted terms")
				}
				var quotedPrice, quotedMinutes, quotedMonths sql.NullInt64
				var price, minutes, months int64
				if err := tx.QueryRowContext(ctx, "SELECT quoted_price_cents,quoted_minutes,quoted_months FROM requests WHERE id=?", id).Scan(&quotedPrice, &quotedMinutes, &quotedMonths); err != nil {
					return err
				}
				if err := tx.QueryRowContext(ctx, "SELECT price_cents,included_minutes,duration_months FROM plans WHERE id=? AND active=1", plan.String).Scan(&price, &minutes, &months); err != nil {
					return errQuote
				}
				if !quotedPrice.Valid || price != quotedPrice.Int64 || minutes != quotedMinutes.Int64 || months != quotedMonths.Int64 {
					return errQuote
				}
				if err := activatePlan(ctx, tx, user, actor, plan.String, reference); err != nil {
					return err
				}
			}
		}
		_, err = tx.ExecContext(ctx, "UPDATE requests SET status=?,admin_note=?,updated_at=? WHERE id=? AND status='pending'", status, note, stamp(), id)
		if err != nil {
			return err
		}
		return audit(ctx, tx, actor, "request."+status, id)
	})
}
