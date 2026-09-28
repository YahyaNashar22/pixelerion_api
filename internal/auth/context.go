package auth

import (
	"context"

	"github.com/YahyaNashar22/pixelerion_api/internal/domain"
)

type contextKey string

const userContextKey contextKey = "user"

type UserIdentity struct {
	ID   string
	Role domain.UserRole
}

func WithUser(ctx context.Context, user UserIdentity) context.Context {
	return context.WithValue(
		ctx, userContextKey, user,
	)
}

func UserFromContext(ctx context.Context) (UserIdentity, bool) {
	user, ok := ctx.Value(userContextKey).(UserIdentity)

	return user, ok
}
