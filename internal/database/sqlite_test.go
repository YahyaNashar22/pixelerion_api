package database

import (
	"context"
	"path/filepath"
	"testing"
)

func TestPersistenceForeignKeysAndRepeatableMigration(t *testing.T) {
	ctx := context.Background()
	path := filepath.Join(t.TempDir(), "portal.db")
	db, err := Open(ctx, path)
	if err != nil {
		t.Fatal(err)
	}
	if _, err = db.Exec("INSERT INTO settings(key,value) VALUES('test','persisted')"); err != nil {
		t.Fatal(err)
	}
	if _, err = db.Exec("INSERT INTO projects(id,client_id,title,created_at) VALUES('x','nonexistent','Bad project','now')"); err == nil {
		t.Fatal("foreign key violation accepted")
	}
	if err = db.Close(); err != nil {
		t.Fatal(err)
	}
	db, err = Open(ctx, path)
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	var value string
	if err = db.QueryRow("SELECT value FROM settings WHERE key='test'").Scan(&value); err != nil || value != "persisted" {
		t.Fatalf("persistence: %q %v", value, err)
	}
	var count int
	if err = db.QueryRow("SELECT count(*) FROM plans").Scan(&count); err != nil || count != 3 {
		t.Fatalf("seeded plans: %d %v", count, err)
	}
}
