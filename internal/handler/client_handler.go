package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/YahyaNashar22/pixelerion_api/internal/service"
)

type ClientHandler struct {
	service *service.ClientService
}

func NewClientHandler(
	service *service.ClientService,
) *ClientHandler {
	return &ClientHandler{
		service: service,
	}
}

type createClientRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type createClientResponse struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Role     string `json:"role"`
}

func (h *ClientHandler) Create(
	w http.ResponseWriter,
	r *http.Request,
) {
	var req createClientRequest

	decoder := json.NewDecoder(r.Body)

	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&req); err != nil {
		writeJSON(
			w,
			http.StatusBadRequest,
			map[string]string{
				"error": "invalid request body",
			},
		)

		return
	}

	user, err := h.service.CreateClient(
		r.Context(),
		service.CreateClientInput{
			Username: req.Username,
			Email:    req.Email,
			Password: req.Password,
		},
	)

	if err != nil {
		if errors.Is(
			err,
			service.ErrClientAlreadyExists,
		) {
			writeJSON(
				w,
				http.StatusConflict,
				map[string]string{
					"error": "client already exists",
				},
			)
			return
		}

		writeJSON(
			w,
			http.StatusBadRequest,
			map[string]string{
				"error": err.Error(),
			},
		)

		return
	}

	writeJSON(
		w,
		http.StatusCreated,
		createClientResponse{
			ID:       user.ID,
			Username: user.Username,
			Email:    user.Email,
			Role:     string(user.Role),
		},
	)
}

func writeJSON(
	w http.ResponseWriter,
	status int,
	data any,
) {
	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	w.WriteHeader(status)

	_ = json.NewEncoder(w).Encode(data)
}
