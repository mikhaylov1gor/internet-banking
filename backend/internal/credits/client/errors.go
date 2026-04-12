package client

import (
	"errors"
	"fmt"
	"net/http"
)

var (
	ErrAccountNotFound     = errors.New("счёт не найден")
	ErrUnauthorized        = errors.New("недействительный токен")
	ErrAccountAccessDenied = errors.New("доступ запрещён")
	ErrCoreBadRequest      = errors.New("ошибка запроса к сервису счетов")
	ErrCoreUnavailable     = errors.New("сервис счетов временно недоступен")
	ErrCoreCircuitOpen     = errors.New("сервис счетов временно отключён из-за ошибок, повторите позже")
)

func mapCoreHTTPError(statusCode int, bodyMsg string) error {
	if bodyMsg == "" {
		bodyMsg = fmt.Sprintf("код %d", statusCode)
	}
	switch statusCode {
	case http.StatusNotFound:
		return fmt.Errorf("%w", ErrAccountNotFound)
	case http.StatusUnauthorized:
		return fmt.Errorf("%w", ErrUnauthorized)
	case http.StatusForbidden:
		return fmt.Errorf("%w", ErrAccountAccessDenied)
	case http.StatusBadRequest:
		return fmt.Errorf("%w: %s", ErrCoreBadRequest, bodyMsg)
	case http.StatusBadGateway, http.StatusServiceUnavailable, http.StatusGatewayTimeout:
		return fmt.Errorf("%w", ErrCoreUnavailable)
	case http.StatusInternalServerError:
		return fmt.Errorf("%w", ErrCoreUnavailable)
	default:
		if statusCode >= 500 {
			return fmt.Errorf("%w", ErrCoreUnavailable)
		}
		if statusCode >= 400 {
			return fmt.Errorf("%w: %s", ErrCoreBadRequest, bodyMsg)
		}
		return fmt.Errorf("%w", ErrCoreUnavailable)
	}
}
