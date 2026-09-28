package handler

import (
	"encoding/json"
	"net/http"

	"github.com/YahyaNashar22/pixelerion_api/internal/appError"
	"github.com/YahyaNashar22/pixelerion_api/internal/httpx"
	"github.com/YahyaNashar22/pixelerion_api/internal/service"
)

type AuthHandler struct {
	service *service.AuthService
}

type loginRequest struct {
	Identifier string `json:"identifier"`
	Password   string `json:"password"`
}

type loginResponse struct {
	AccessToken string       `json:"accessToken"`
	User        loginUserDTO `json:"user"`
}

type loginUserDTO struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Role     string `json:"role"`
}

func NewAuthHandler(service *service.AuthService) *AuthHandler {
	return &AuthHandler{
		service: service,
	}
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&req); err != nil {
		httpx.WriteError(w, appError.Validation("invalid request body", err))

		return
	}

	result, err := h.service.Login(r.Context(), service.LoginInput{
		Identifier: req.Identifier,
		Password:   req.Password,
	})

	if err != nil {
		httpx.WriteError(w, err)
		return
	}

	httpx.WriteJSON(w, http.StatusOK, loginResponse{
		AccessToken: result.AccessToken,
		User: loginUserDTO{
			ID:       result.User.ID,
			Username: result.User.Username,
			Email:    result.User.Email,
			Role:     string(result.User.Role),
		},
	})
}
