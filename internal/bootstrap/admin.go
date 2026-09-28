package bootstrap

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/YahyaNashar22/pixelerion_api/internal/domain"
	"github.com/YahyaNashar22/pixelerion_api/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

func EnsureAdmin(
	ctx context.Context,
	users repository.UserRepository,
	username string,
	email string,
	password string,
) error {
	email = strings.TrimSpace(strings.ToLower(email))

	username = strings.TrimSpace(strings.ToLower(username))

	if username == "" || email == "" || password == "" {
		return nil
	}

	_, err := users.FindByEmail(ctx, email)

	if err == nil {
		return nil
	}

	if !errors.Is(err, repository.ErrNotFound) {
		return fmt.Errorf("find bootstrap admin: %w", err)
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

	if err != nil {
		return fmt.Errorf("hash bootstrap admin password: %w", err)
	}

	now := time.Now().UTC()

	admin := &domain.User{
		Username:     username,
		Email:        email,
		PasswordHash: string(passwordHash),
		Role:         domain.UserRoleAdmin,
		ProjectIDs:   []string{},
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	if err := users.Create(ctx, admin); err != nil {
		return fmt.Errorf("create bootstrap admin: %w", err)
	}

	return nil
}
