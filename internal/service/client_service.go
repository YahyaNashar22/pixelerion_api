package service

import (
	"context"
	"errors"
	"net/mail"
	"strings"
	"time"

	appError "github.com/YahyaNashar22/pixelerion_api/internal/apperror"
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
		return nil, appError.Validation("username is required", nil)
	}

	if len(username) < 3 {
		return nil, appError.Validation("username must contain at least 3 characters", nil)
	}

	if _, err := mail.ParseAddress(email); err != nil {
		return nil, appError.Validation("invalid email address", err)
	}

	if len(input.Password) < 6 {
		return nil, appError.Validation("password must contain at least 6 characters", nil)
	}

	passwordHash, err := bcrypt.GenerateFromPassword(
		[]byte(input.Password),
		bcrypt.DefaultCost,
	)

	if err != nil {
		return nil, appError.Internal(
			"failed to process password",
			err,
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
			return nil, appError.Conflict(
				"client already exists",
				err,
			)
		}

		return nil, appError.Internal(
			"failed to create client",
			err,
		)
	}

	return user, nil
}
