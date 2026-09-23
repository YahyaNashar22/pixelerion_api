package appError

import "fmt"

type Code string

const (
	CodeValidation   Code = "VALIDATION_ERROR"
	CodeUnauthorized Code = "UNAUTHORIZED"
	CodeForbidden    Code = "FORBIDDEN"
	CodeNotFound     Code = "NOT_FOUND"
	CodeConflict     Code = "CONFLICT"
	CodeInternal     Code = "INTERNAL_ERROR"
)

type Error struct {
	Code    Code
	Message string
	Err     error
}

func (e *Error) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.Err)
	}

	return e.Message
}

func (e *Error) Unwrap() error {
	return e.Err
}

func Validation(message string, err error) *Error {
	return &Error{
		Code:    CodeValidation,
		Message: message,
		Err:     err,
	}
}

func Unauthorized(message string, err error) *Error {
	return &Error{
		Code:    CodeUnauthorized,
		Message: message,
		Err:     err,
	}
}

func Forbidden(message string, err error) *Error {
	return &Error{
		Code:    CodeForbidden,
		Message: message,
		Err:     err,
	}
}

func NotFound(message string, err error) *Error {
	return &Error{
		Code:    CodeNotFound,
		Message: message,
		Err:     err,
	}
}

func Conflict(message string, err error) *Error {
	return &Error{
		Code:    CodeConflict,
		Message: message,
		Err:     err,
	}
}

func Internal(message string, err error) *Error {
	return &Error{
		Code:    CodeInternal,
		Message: message,
		Err:     err,
	}
}
