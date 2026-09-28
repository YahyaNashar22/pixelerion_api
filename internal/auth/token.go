package auth

import (
	"fmt"
	"time"

	"github.com/YahyaNashar22/pixelerion_api/internal/domain"
	"github.com/golang-jwt/jwt/v5"
)

type TokenManager struct {
	secret []byte
	ttl    time.Duration
}

type Claims struct {
	Role domain.UserRole `json:"role"`
	jwt.RegisteredClaims
}

func NewTokenManager(secret string, ttl time.Duration) *TokenManager {
	return &TokenManager{
		secret: []byte(secret),
		ttl:    ttl,
	}
}

func (m *TokenManager) Generate(user *domain.User) (string, error) {
	now := time.Now().UTC()

	claims := Claims{
		Role: user.Role,

		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   user.ID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(m.ttl)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	signedToken, err := token.SignedString(m.secret)

	if err != nil {
		return "", fmt.Errorf("sign access token: %w", err)
	}

	return signedToken, nil
}

func (m *TokenManager) Validate(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (any, error) {
		if token.Method != jwt.SigningMethodHS256 {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return m.secret, nil
	})

	if err != nil {
		return nil, fmt.Errorf("parse access token: %w", err)
	}

	claims, ok := token.Claims.(*Claims)

	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid access token")
	}

	return claims, nil
}
