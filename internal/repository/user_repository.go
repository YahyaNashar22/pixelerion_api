package repository

import (
	"context"

	"github.com/YahyaNashar22/pixelerion_api/internal/domain"
)

type UserRepository interface {
	Create(
		ctx context.Context,
		user *domain.User,
	) error

	FindByEmail(
		ctx context.Context,
		email string,
	) (*domain.User, error)

	FindByUsername(
		ctx context.Context,
		username string,
	) (*domain.User, error)
}
