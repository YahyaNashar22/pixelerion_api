package portal

import "testing"

func TestFutureMonthlyAllocationsCannotBeSpentEarly(t *testing.T) {
	f := setup(t)
	client, cookie := f.client("alice")
	_, plan := f.call("POST", "/admin/plans", Record{"name": "Quarterly custom", "description": "Three monthly allocations", "price_cents": 6000, "included_minutes": 180, "duration_months": 3, "response_target": "2 business days", "active": true}, f.admin, 200)
	f.call("POST", "/admin/clients/"+client+"/subscription", Record{"plan_id": plan["id"], "payment_reference": "External payment of USD 180", "terms_accepted": true}, f.admin, 201)
	_, out := f.call("GET", "/workspace", nil, cookie, 200)
	if out["balance_minutes"] != float64(180) {
		t.Fatalf("future credits leaked into balance: %v", out["balance_minutes"])
	}
	if len(out["ledger"].([]any)) != 3 {
		t.Fatal("monthly schedule missing")
	}
	contract := out["subscriptions"].([]any)[0].(map[string]any)
	if contract["price_cents"] != float64(18000) || contract["included_minutes"] != float64(540) {
		t.Fatal("agreement snapshot incorrect")
	}
	f.call("POST", "/admin/clients/"+client+"/minutes", Record{"minutes": -181, "description": "Cannot borrow from future months"}, f.admin, 409)
}
func TestPlanRequestCannotApproveChangedPricing(t *testing.T) {
	f := setup(t)
	_, cookie := f.client("alice")
	_, out := f.call("POST", "/requests", Record{"kind": "plan_change", "title": "Standard plan", "body": "Please activate", "plan_id": "standard", "terms_accepted": true}, cookie, 201)
	id := out["id"].(string)
	if _, err := f.db.Exec("UPDATE plans SET price_cents=7000 WHERE id='standard'"); err != nil {
		t.Fatal(err)
	}
	f.call("PATCH", "/admin/requests/"+id, Record{"status": "approved", "payment_reference": "USD 60 externally", "terms_accepted": true}, f.admin, 409)
	var n int
	f.db.QueryRow("SELECT count(*) FROM subscriptions").Scan(&n)
	if n != 0 {
		t.Fatal("changed plan activated without new consent")
	}
	f.db.QueryRow("SELECT count(*) FROM minute_ledger").Scan(&n)
	if n != 0 {
		t.Fatal("failed activation partially credited")
	}
}
