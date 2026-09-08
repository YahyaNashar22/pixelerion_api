package service

import (
	"context"
	"errors"
	"fmt"
	"net/mail"
	"strings"
	"time"

	"github.com/YahyaNashar22/pixelerion_api/internal/domain"
	"github.com/YahyaNashar22/pixelerion_api/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

type ClientService struct {
	users repository.UserRepository
}

func NewClientService(
	users repository.UserRepository,
) *ClientService {
	return &ClientService{
		users: users,
	}
}

type CreateClientInput struct {
	Username string
	Email    string
	Password string
}

func (
	s *ClientService,
) CreateClient(
	ctx context.Context,
	input CreateClientInput,
) (*domain.User, error) {

	username := strings.TrimSpace(
		strings.ToLower(input.Username),
	)

	email := strings.TrimSpace(
		strings.ToLower(input.Email),
	)

	if username == "" {
		return nil, fmt.Errorf("username is required")
	}

	if len(username) < 3 {
		return nil, fmt.Errorf("username must contain at least 3 characters")
	}

	if _, err := mail.ParseAddress(email); err != nil {
		return nil, fmt.Errorf("invalid email address")
	}

	if len(input.Password) < 6 {
		return nil, fmt.Errorf("password must contain at least 6 characters")
	}

	passwordHash, err := bcrypt.GenerateFromPassword(
		[]byte(input.Password),
		bcrypt.DefaultCost,
	)

	if err != nil {
		return nil, fmt.Errorf(
			"hash password: %w", err,
		)
	}

	now := time.Now().UTC()

	user := &domain.User{
		Username: username,
		Email:    email,

		PasswordHash: string(passwordHash),

		Role: domain.UserRoleClient,

		ProjectIDs: []string{},

		CreatedAt: now,
		UpdatedAt: now,
	}

	err = s.users.Create(ctx, user)

	if err != nil {
		if errors.Is(
			err,
			repository.ErrConflict,
		) {
			return nil, repository.ErrClientAlreadyExists
		}

		return nil, fmt.Errorf(
			"create client: %w", err,
		)
	}

	return user, nil
}
