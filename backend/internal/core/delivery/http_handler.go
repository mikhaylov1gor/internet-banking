package delivery

import (
	"encoding/json"
	"net/http"
	"strconv"

	"internet-bank/internal/core/entity"
	"internet-bank/internal/core/usecase"
	"internet-bank/pkg/auth"
	"internet-bank/pkg/response"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type AccountUseCase interface {
	OpenAccount(clientID uuid.UUID) (*entity.Account, error)
	GetByID(id uuid.UUID) (*entity.Account, error)
	List(clientID *uuid.UUID, status *entity.AccountStatus, limit, offset int) ([]*entity.Account, error)
	CloseAccount(accountID, clientID uuid.UUID) error
	Deposit(accountID uuid.UUID, amount float64, description string) (*entity.Operation, error)
	Withdraw(accountID uuid.UUID, amount float64, description string) (*entity.Operation, error)
	ListOperations(accountID uuid.UUID, limit, offset int) ([]*entity.Operation, error)
}

type Handler struct {
	uc        AccountUseCase
	jwtSecret string
}

func NewHandler(uc AccountUseCase, jwtSecret string) *Handler {
	return &Handler{uc: uc, jwtSecret: jwtSecret}
}

func (h *Handler) authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || len(authHeader) < 8 {
			response.Err(w, http.StatusUnauthorized, "missing or invalid authorization header")
			return
		}
		tokenString := authHeader[7:]
		claims, err := auth.ParseAccessToken(tokenString, h.jwtSecret)
		if err != nil {
			response.Err(w, http.StatusUnauthorized, "invalid token")
			return
		}
		userID, err := uuid.Parse(claims.UserID)
		if err != nil {
			response.Err(w, http.StatusUnauthorized, "invalid token")
			return
		}
		ctx := withUser(r.Context(), userID, claims.UserType)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (h *Handler) Mount(r chi.Router) {
	r.Group(func(r chi.Router) {
		r.Use(h.authMiddleware)
		r.Post("/accounts", h.openAccount)
		r.Get("/accounts", h.listAccounts)
		r.Get("/accounts/{accountId}", h.getAccount)
		r.Delete("/accounts/{accountId}", h.closeAccount)
		r.Post("/accounts/{accountId}/deposit", h.deposit)
		r.Post("/accounts/{accountId}/withdraw", h.withdraw)
		r.Get("/accounts/{accountId}/operations", h.listOperations)
	})
}

func (h *Handler) openAccount(w http.ResponseWriter, r *http.Request) {
	userID, userType := userFromContext(r.Context())
	if userID == nil {
		response.Err(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	var body struct {
		ClientID string `json:"client_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.Err(w, http.StatusBadRequest, "invalid body")
		return
	}
	clientID, err := uuid.Parse(body.ClientID)
	if err != nil {
		response.Err(w, http.StatusBadRequest, "invalid client_id")
		return
	}
	if userType == auth.UserTypeClient && *userID != clientID {
		response.Err(w, http.StatusForbidden, "forbidden")
		return
	}
	acc, err := h.uc.OpenAccount(clientID)
	if err != nil {
		response.Err(w, http.StatusBadRequest, err.Error())
		return
	}
	response.JSON(w, http.StatusCreated, toAccountResp(acc))
}

func (h *Handler) listAccounts(w http.ResponseWriter, r *http.Request) {
	userID, userType := userFromContext(r.Context())
	if userID == nil {
		response.Err(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	var clientID *uuid.UUID
	if userType == auth.UserTypeClient {
		clientID = userID
	} else {
		if c := r.URL.Query().Get("client_id"); c != "" {
			parsed, err := uuid.Parse(c)
			if err != nil {
				response.Err(w, http.StatusBadRequest, "invalid client_id")
				return
			}
			clientID = &parsed
		}
	}
	var status *entity.AccountStatus
	if s := r.URL.Query().Get("status"); s != "" {
		st := entity.AccountStatus(s)
		if st != entity.AccountStatusActive && st != entity.AccountStatusClosed {
			response.Err(w, http.StatusBadRequest, "invalid status")
			return
		}
		status = &st
	}
	limit := 50
	if l := r.URL.Query().Get("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil && v > 0 {
			limit = v
		}
	}
	offset := 0
	if o := r.URL.Query().Get("offset"); o != "" {
		if v, err := strconv.Atoi(o); err == nil && v >= 0 {
			offset = v
		}
	}
	list, err := h.uc.List(clientID, status, limit, offset)
	if err != nil {
		response.Err(w, http.StatusInternalServerError, err.Error())
		return
	}
	res := make([]accountResp, len(list))
	for i, a := range list {
		res[i] = toAccountResp(a)
	}
	response.JSON(w, http.StatusOK, res)
}

func (h *Handler) getAccount(w http.ResponseWriter, r *http.Request) {
	userID, userType := userFromContext(r.Context())
	if userID == nil {
		response.Err(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	accountID, err := uuid.Parse(chi.URLParam(r, "accountId"))
	if err != nil {
		response.Err(w, http.StatusBadRequest, "invalid accountId")
		return
	}
	acc, err := h.uc.GetByID(accountID)
	if err != nil {
		response.Err(w, http.StatusNotFound, "account not found")
		return
	}
	if userType == auth.UserTypeClient && acc.ClientID != *userID {
		response.Err(w, http.StatusForbidden, "forbidden")
		return
	}
	response.JSON(w, http.StatusOK, toAccountResp(acc))
}

func (h *Handler) closeAccount(w http.ResponseWriter, r *http.Request) {
	userID, _ := userFromContext(r.Context())
	if userID == nil {
		response.Err(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	accountID, err := uuid.Parse(chi.URLParam(r, "accountId"))
	if err != nil {
		response.Err(w, http.StatusBadRequest, "invalid accountId")
		return
	}
	clientIDStr := r.URL.Query().Get("client_id")
	if clientIDStr == "" {
		response.Err(w, http.StatusBadRequest, "client_id required")
		return
	}
	clientID, err := uuid.Parse(clientIDStr)
	if err != nil {
		response.Err(w, http.StatusBadRequest, "invalid client_id")
		return
	}
	if *userID != clientID {
		response.Err(w, http.StatusForbidden, "forbidden")
		return
	}
	err = h.uc.CloseAccount(accountID, clientID)
	if err != nil {
		if err == usecase.ErrAccountNotFound {
			response.Err(w, http.StatusNotFound, "account not found")
			return
		}
		response.Err(w, http.StatusForbidden, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) deposit(w http.ResponseWriter, r *http.Request) {
	userID, userType := userFromContext(r.Context())
	if userID == nil {
		response.Err(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	accountID, err := uuid.Parse(chi.URLParam(r, "accountId"))
	if err != nil {
		response.Err(w, http.StatusBadRequest, "invalid accountId")
		return
	}
	acc, err := h.uc.GetByID(accountID)
	if err != nil {
		response.Err(w, http.StatusNotFound, "account not found")
		return
	}
	if userType == auth.UserTypeClient && acc.ClientID != *userID {
		response.Err(w, http.StatusForbidden, "forbidden")
		return
	}
	var body struct {
		Amount float64 `json:"amount"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.Err(w, http.StatusBadRequest, "invalid body")
		return
	}
	op, err := h.uc.Deposit(accountID, body.Amount, "")
	if err != nil {
		if err == usecase.ErrInvalidAmount {
			response.Err(w, http.StatusBadRequest, err.Error())
			return
		}
		response.Err(w, http.StatusBadRequest, err.Error())
		return
	}
	response.JSON(w, http.StatusOK, toOperationResp(op))
}

func (h *Handler) withdraw(w http.ResponseWriter, r *http.Request) {
	userID, userType := userFromContext(r.Context())
	if userID == nil {
		response.Err(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	accountID, err := uuid.Parse(chi.URLParam(r, "accountId"))
	if err != nil {
		response.Err(w, http.StatusBadRequest, "invalid accountId")
		return
	}
	acc, err := h.uc.GetByID(accountID)
	if err != nil {
		response.Err(w, http.StatusNotFound, "account not found")
		return
	}
	if userType == auth.UserTypeClient && acc.ClientID != *userID {
		response.Err(w, http.StatusForbidden, "forbidden")
		return
	}
	var body struct {
		Amount float64 `json:"amount"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.Err(w, http.StatusBadRequest, "invalid body")
		return
	}
	op, err := h.uc.Withdraw(accountID, body.Amount, "")
	if err != nil {
		if err == usecase.ErrInsufficientFunds || err == usecase.ErrInvalidAmount {
			response.Err(w, http.StatusBadRequest, err.Error())
			return
		}
		response.Err(w, http.StatusBadRequest, err.Error())
		return
	}
	response.JSON(w, http.StatusOK, toOperationResp(op))
}

func (h *Handler) listOperations(w http.ResponseWriter, r *http.Request) {
	userID, userType := userFromContext(r.Context())
	if userID == nil {
		response.Err(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	accountID, err := uuid.Parse(chi.URLParam(r, "accountId"))
	if err != nil {
		response.Err(w, http.StatusBadRequest, "invalid accountId")
		return
	}
	acc, err := h.uc.GetByID(accountID)
	if err != nil {
		response.Err(w, http.StatusNotFound, "account not found")
		return
	}
	if userType == auth.UserTypeClient && acc.ClientID != *userID {
		response.Err(w, http.StatusForbidden, "forbidden")
		return
	}
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if limit <= 0 {
		limit = 50
	}
	list, err := h.uc.ListOperations(accountID, limit, offset)
	if err != nil {
		response.Err(w, http.StatusInternalServerError, err.Error())
		return
	}
	res := make([]operationResp, len(list))
	for i, o := range list {
		res[i] = toOperationResp(o)
	}
	response.JSON(w, http.StatusOK, res)
}

type accountResp struct {
	ID       string  `json:"id"`
	ClientID string  `json:"client_id"`
	Balance  float64 `json:"balance"`
	Currency string  `json:"currency,omitempty"`
	Status   string  `json:"status"`
	OpenedAt string  `json:"opened_at"`
	ClosedAt *string `json:"closed_at,omitempty"`
}

type operationResp struct {
	ID           string  `json:"id"`
	AccountID    string  `json:"account_id"`
	Type         string  `json:"type"`
	Amount       float64 `json:"amount"`
	BalanceAfter float64 `json:"balance_after"`
	CreatedAt    string  `json:"created_at"`
	Description  string  `json:"description,omitempty"`
	CreditID     *string `json:"credit_id,omitempty"`
}

func toAccountResp(a *entity.Account) accountResp {
	r := accountResp{
		ID:       a.ID.String(),
		ClientID: a.ClientID.String(),
		Balance:  a.Balance,
		Currency: string(a.Currency),
		Status:   string(a.Status),
		OpenedAt: a.OpenedAt.Format("2006-01-02T15:04:05.000Z07:00"),
	}
	if a.ClosedAt != nil {
		s := a.ClosedAt.Format("2006-01-02T15:04:05.000Z07:00")
		r.ClosedAt = &s
	}
	return r
}

func toOperationResp(o *entity.Operation) operationResp {
	r := operationResp{
		ID:           o.ID.String(),
		AccountID:    o.AccountID.String(),
		Type:         string(o.Type),
		Amount:       o.Amount,
		BalanceAfter: o.BalanceAfter,
		CreatedAt:    o.CreatedAt.Format("2006-01-02T15:04:05.000Z07:00"),
		Description:  o.Description,
	}
	if o.CreditID != nil {
		s := o.CreditID.String()
		r.CreditID = &s
	}
	return r
}
