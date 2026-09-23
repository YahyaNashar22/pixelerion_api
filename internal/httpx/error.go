package httpx

import (
	"errors"
	"net/http"

	"github.com/YahyaNashar22/pixelerion_api/internal/appError"
)

type errorResponse struct {
	Error errorBody `json:"error"`
}

type errorBody struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func WriteError(w http.ResponseWriter, err error) {
	var appErr *appError.Error

	if !errors.As(err, &appErr) {
		WriteJSON(w, http.StatusInternalServerError, errorResponse{
			Error: errorBody{
				Code:    string(appError.CodeInternal),
				Message: "internal server error",
			},
		})
		return
	}

	status := statusFromCode(appErr.Code)

	message := appErr.Message

	if appErr.Code == appError.CodeInternal {
		message = "internal server error"
	}

	WriteJSON(w, status, errorResponse{
		Error: errorBody{
			Code:    string(appErr.Code),
			Message: message,
		},
	})
}

func statusFromCode(code appError.Code) int {
	switch code {
	case appError.CodeValidation:
		return http.StatusBadRequest
	case appError.CodeUnauthorized:
		return http.StatusUnauthorized
	case appError.CodeForbidden:
		return http.StatusForbidden
	case appError.CodeNotFound:
		return http.StatusNotFound
	case appError.CodeConflict:
		return http.StatusConflict
	default:
		return http.StatusInternalServerError
	}
}
