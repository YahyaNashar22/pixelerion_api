package middleware

import (
	"net/http"

	"github.com/YahyaNashar22/pixelerion_api/internal/appError"
	"github.com/YahyaNashar22/pixelerion_api/internal/auth"
	"github.com/YahyaNashar22/pixelerion_api/internal/domain"
	"github.com/YahyaNashar22/pixelerion_api/internal/httpx"
)

func RequireRole(role domain.UserRole) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			user, ok := auth.UserFromContext(r.Context())

			if !ok {
				httpx.WriteError(w, appError.Unauthorized("authentication required", nil))
				return
			}

			if user.Role != role {
				httpx.WriteError(w, appError.Forbidden("insufficient permissions", nil))
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
