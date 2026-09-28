package service

import (
	"context"
	"errors"
	"strings"

	"github.com/YahyaNashar22/pixelerion_api/internal/appError"
	"github.com/YahyaNashar22/pixelerion_api/internal/auth"
	"github.com/YahyaNashar22/pixelerion_api/internal/domain"
	"github.com/YahyaNashar22/pixelerion_api/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	users  repository.UserRepository
	tokens *auth.TokenManager
}

type LoginInput struct {
	Identifier string
	Password   string
}

type LoginResult struct {
	AccessToken string
	User        *domain.User
}

func NewAuthService(users repository.UserRepository, tokens *auth.TokenManager) *AuthService {
	return &AuthService{
		users:  users,
		tokens: tokens,
	}

}
func (s *AuthService) Login(ctx context.Context, input LoginInput) (*LoginResult, error) {
	identifier := strings.TrimSpace(strings.ToLower(input.Identifier))

	if identifier == "" || input.Password == "" {
		return nil, appError.Validation("identifier and password are required", nil)
	}

	var user *domain.User
	var err error

	if strings.Contains(identifier, "@") {
		user, err = s.users.FindByEmail(ctx, identifier)
	} else {
		user, err = s.users.FindByUsername(
			ctx, identifier,
		)
	}

	if err != nil {
		if errors.Is(
			err, repository.ErrNotFound,
		) {
			return nil, appError.Unauthorized("invalid credentials", err)
		}

		return nil, appError.Internal("failed to authenticate user", err)
	}

	err = bcrypt.CompareHashAndPassword(
		[]byte(user.PasswordHash), []byte(input.Password),
	)

	if err != nil {
		return nil, appError.Unauthorized("invalid credentials", err)
	}

	accessToken, err := s.tokens.Generate(user)

	if err != nil {
		return nil, appError.Internal("failed to generate access token", err)
	}

	return &LoginResult{
		AccessToken: accessToken,
		User:        user,
	}, nil
}
