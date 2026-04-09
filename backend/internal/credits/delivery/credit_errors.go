package delivery

import (
	"errors"
	"net/http"
	"strings"

	"internet-bank/internal/credits/client"
	"internet-bank/internal/credits/usecase"
	"internet-bank/pkg/response"
)

func writeCoreClientError(w http.ResponseWriter, err error) bool {
	switch {
	case errors.Is(err, client.ErrAccountNotFound):
		response.Err(w, http.StatusNotFound, client.ErrAccountNotFound.Error())
		return true
	case errors.Is(err, client.ErrUnauthorized):
		response.Err(w, http.StatusUnauthorized, client.ErrUnauthorized.Error())
		return true
	case errors.Is(err, client.ErrAccountAccessDenied):
		response.Err(w, http.StatusForbidden, client.ErrAccountAccessDenied.Error())
		return true
	case errors.Is(err, client.ErrCoreUnavailable):
		response.Err(w, http.StatusBadGateway, "сервис счетов временно недоступен")
		return true
	case errors.Is(err, client.ErrCoreBadRequest):
		msg := strings.TrimPrefix(err.Error(), client.ErrCoreBadRequest.Error()+": ")
		if msg == "" {
			msg = client.ErrCoreBadRequest.Error()
		}
		response.Err(w, http.StatusBadRequest, msg)
		return true
	default:
		return false
	}
}

func writeIssueCreditError(w http.ResponseWriter, err error) {
	if err == nil {
		return
	}
	if err == usecase.ErrTariffNotFound {
		response.Err(w, http.StatusBadRequest, "тариф не найден")
		return
	}
	if err == usecase.ErrAmountOutOfRange {
		response.Err(w, http.StatusBadRequest, err.Error())
		return
	}
	if err == usecase.ErrInvalidTerm {
		response.Err(w, http.StatusBadRequest, "укажите срок кредита: term_days и/или term_months (положительные числа)")
		return
	}
	if err == usecase.ErrTermTooLong {
		response.Err(w, http.StatusBadRequest, usecase.ErrTermTooLong.Error())
		return
	}
	if errors.Is(err, usecase.ErrInternalToken) {
		response.Err(w, http.StatusInternalServerError, "внутренняя ошибка сервиса")
		return
	}
	if writeCoreClientError(w, err) {
		return
	}
	if errors.Is(err, usecase.ErrAccountWrongClient) {
		response.Err(w, http.StatusForbidden, usecase.ErrAccountWrongClient.Error())
		return
	}
	if errors.Is(err, usecase.ErrAccountInactive) {
		response.Err(w, http.StatusConflict, usecase.ErrAccountInactive.Error())
		return
	}
	response.Err(w, http.StatusBadRequest, err.Error())
}

func writeCheckCreditAvailabilityError(w http.ResponseWriter, err error) {
	if err == nil {
		return
	}
	if errors.Is(err, usecase.ErrCreditPreviewAmount) {
		response.Err(w, http.StatusBadRequest, usecase.ErrCreditPreviewAmount.Error())
		return
	}
	if errors.Is(err, usecase.ErrInternalToken) {
		response.Err(w, http.StatusInternalServerError, "внутренняя ошибка сервиса")
		return
	}
	if writeCoreClientError(w, err) {
		return
	}
	response.Err(w, http.StatusBadRequest, err.Error())
}

func writeRepayCreditError(w http.ResponseWriter, err error) {
	if err == nil {
		return
	}
	if errors.Is(err, usecase.ErrCreditNotFound) {
		response.Err(w, http.StatusNotFound, usecase.ErrCreditNotFound.Error())
		return
	}
	if errors.Is(err, usecase.ErrCreditNotActive) {
		response.Err(w, http.StatusConflict, usecase.ErrCreditNotActive.Error())
		return
	}
	if errors.Is(err, usecase.ErrInternalToken) {
		response.Err(w, http.StatusInternalServerError, "внутренняя ошибка сервиса")
		return
	}
	if writeCoreClientError(w, err) {
		return
	}
	if errors.Is(err, usecase.ErrAccountNotOwned) {
		response.Err(w, http.StatusForbidden, usecase.ErrAccountNotOwned.Error())
		return
	}
	if errors.Is(err, usecase.ErrAccountInactive) {
		response.Err(w, http.StatusConflict, usecase.ErrAccountInactive.Error())
		return
	}
	if errors.Is(err, usecase.ErrInsufficientFunds) {
		response.Err(w, http.StatusBadRequest, usecase.ErrInsufficientFunds.Error())
		return
	}
	if errors.Is(err, usecase.ErrRepayAmountTooSmall) {
		response.Err(w, http.StatusBadRequest, usecase.ErrRepayAmountTooSmall.Error())
		return
	}
	response.Err(w, http.StatusBadRequest, err.Error())
}
