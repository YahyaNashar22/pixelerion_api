package domain

import "time"

type UserRole string

const (
	UserRoleAdmin  UserRole = "ADMIN"
	UserRoleClient UserRole = "CLIENT"
)

type User struct {
	ID string

	Username     string
	Email        string
	PasswordHash string

	Role UserRole

	ProjectIDs []string

	CreatedAt time.Time
	UpdatedAt time.Time
}
