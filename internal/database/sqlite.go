package database

import (
	"context"
	"database/sql"
	"embed"
	"fmt"
	_ "modernc.org/sqlite"
	"os"
	"path/filepath"
)

//go:embed migrations/*.sql
var migrations embed.FS

func Open(ctx context.Context, path string) (*sql.DB, error) {
	if path != ":memory:" {
		if err := os.MkdirAll(filepath.Dir(path), 0700); err != nil {
			return nil, err
		}
	}
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	// Serialize writes and keep connection-level PRAGMAs consistent.
	db.SetMaxOpenConns(1)
	db.SetMaxIdleConns(1)
	fail := func(err error) (*sql.DB, error) { db.Close(); return nil, err }
	for _, statement := range []string{"PRAGMA foreign_keys=ON", "PRAGMA journal_mode=WAL", "PRAGMA busy_timeout=5000", "PRAGMA synchronous=FULL"} {
		if _, err := db.ExecContext(ctx, statement); err != nil {
			return fail(err)
		}
	}
	if _, err := db.ExecContext(ctx, "CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY)"); err != nil {
		return fail(err)
	}
	entries, err := migrations.ReadDir("migrations")
	if err != nil {
		return fail(err)
	}
	for _, entry := range entries {
		var exists int
		err := db.QueryRowContext(ctx, "SELECT count(*) FROM schema_migrations WHERE name=?", entry.Name()).Scan(&exists)
		if err != nil {
			return fail(err)
		}
		if exists > 0 {
			continue
		}
		content, err := migrations.ReadFile("migrations/" + entry.Name())
		if err != nil {
			return fail(err)
		}
		tx, err := db.BeginTx(ctx, nil)
		if err != nil {
			return fail(err)
		}
		if _, err = tx.ExecContext(ctx, string(content)); err == nil {
			_, err = tx.ExecContext(ctx, "INSERT INTO schema_migrations(name) VALUES(?)", entry.Name())
		}
		if err != nil {
			tx.Rollback()
			return fail(fmt.Errorf("migration %s: %w", entry.Name(), err))
		}
		if err = tx.Commit(); err != nil {
			return fail(err)
		}
	}
	return db, nil
}
