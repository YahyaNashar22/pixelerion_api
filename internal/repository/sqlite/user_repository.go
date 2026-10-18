package sqlite

import (
	"context"
	"crypto/rand"
	"database/sql"
	"errors"
	"github.com/YahyaNashar22/pixelerion_api/internal/domain"
	"github.com/YahyaNashar22/pixelerion_api/internal/repository"
	"strings"
	"time"
)

type UserRepository struct{ DB *sql.DB }

func NewUserRepository(db *sql.DB) *UserRepository { return &UserRepository{db} }
func (r *UserRepository) Create(ctx context.Context, u *domain.User) error {
	u.ID = rand.Text()
	_, err := r.DB.ExecContext(ctx, `INSERT INTO users(id,username,email,password_hash,role,created_at,updated_at) VALUES(?,?,?,?,?,?,?)`, u.ID, u.Username, u.Email, u.PasswordHash, u.Role, u.CreatedAt.UTC().Format(time.RFC3339Nano), u.UpdatedAt.UTC().Format(time.RFC3339Nano))
	if err != nil && strings.Contains(err.Error(), "UNIQUE constraint failed") {
		return repository.ErrConflict
	}
	return err
}
func (r *UserRepository) find(ctx context.Context, column, value string) (*domain.User, error) {
	u := &domain.User{ProjectIDs: []string{}}
	var created, updated string
	err := r.DB.QueryRowContext(ctx, `SELECT id,username,email,password_hash,role,created_at,updated_at FROM users WHERE `+column+`=?`, value).Scan(&u.ID, &u.Username, &u.Email, &u.PasswordHash, &u.Role, &created, &updated)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, repository.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	u.CreatedAt, _ = time.Parse(time.RFC3339Nano, created)
	u.UpdatedAt, _ = time.Parse(time.RFC3339Nano, updated)
	return u, nil
}
func (r *UserRepository) FindByID(ctx context.Context, id string) (*domain.User, error) {
	return r.find(ctx, "id", id)
}
func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	return r.find(ctx, "email", email)
}
func (r *UserRepository) FindByUsername(ctx context.Context, name string) (*domain.User, error) {
	return r.find(ctx, "username", name)
}
