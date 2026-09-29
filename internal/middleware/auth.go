package middleware

import (
	"net/http"
	"strings"

	"github.com/YahyaNashar22/pixelerion_api/internal/appError"
	"github.com/YahyaNashar22/pixelerion_api/internal/auth"
	"github.com/YahyaNashar22/pixelerion_api/internal/httpx"
)

func Authenticate(tokens *auth.TokenManager) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(
			func(w http.ResponseWriter, r *http.Request) {
				header := r.Header.Get("Authorization")

				if header == "" {
					httpx.WriteError(w, appError.Unauthorized("authentication required", nil))
					return
				}

				const prefix = "Bearer"

				if !strings.HasPrefix(header, prefix) {
					httpx.WriteError(w, appError.Unauthorized("invalid authorization header", nil))

					return
				}

				tokenString := strings.TrimSpace(strings.TrimPrefix(header, prefix))

				if tokenString == "" {
					httpx.WriteError(w, appError.Unauthorized("invalid access token", nil))
					return
				}

				claims, err := tokens.Validate(tokenString)

				if err != nil {
					httpx.WriteError(w, appError.Unauthorized("invalid or expired access token", err))

					return
				}

				ctx := auth.WithUser(r.Context(), auth.UserIdentity{
					ID:   claims.Subject,
					Role: claims.Role,
				})

				next.ServeHTTP(w, r.WithContext(ctx))
			},
		)
	}
}
