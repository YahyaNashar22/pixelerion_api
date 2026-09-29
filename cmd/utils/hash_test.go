package utils

import (
	"fmt"

	"testing"

	"golang.org/x/crypto/bcrypt"
)

func TestPasswordHash(t *testing.T) {

	password := "password123"

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

	if err != nil {
		fmt.Println("error hashing password", err)
	}

	fmt.Println("password hash: ", string(passwordHash))
}
