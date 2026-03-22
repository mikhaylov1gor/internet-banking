package delivery

import (
	"encoding/json"
	"net/http"
	"strconv"

	"internet-bank/internal/core/entity"
	"internet-bank/internal/core/realtime"
	"internet-bank/internal/core/usecase"
	"internet-bank/pkg/auth"
	"internet-bank/pkg/response"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type AccountUseCase interface {
	OpenAccount(clientID uuid.UUID, currency entity.Currency) (*entity.Account, error)
	GetByID(id uuid.UUID) (*entity.Account, error)
	GetByNumber(accountNumber string) (*entity.Account, error)
	List(clientID *uuid.UUID, status *entity.AccountStatus, limit, offset int) ([]*entity.Account, int64, error)
	CloseAccount(accountID, clientID uuid.UUID) error
	Deposit(accountID uuid.UUID, amount float64, description string) (*entity.Operation, error)
	Withdraw(accountID uuid.UUID, amount float64, description string) (*entity.Operation, error)
	Transfer(fromAccountID, toAccountID uuid.UUID, amount float64, description string) (*entity.Operation, *entity.Operation, error)
	PreviewTransfer(fromAccountID, toAccountID uuid.UUID, amount float64) (*usecase.TransferQuote, error)
	ListOperations(accountID uuid.UUID, limit, offset int) ([]*entity.Operation, int64, error)
}

type Handler struct {
	uc        AccountUseCase
	jwtSecret string
	hub       *realtime.Hub
}

func NewHandler(uc AccountUseCase, jwtSecret string, hub *realtime.Hub) *Handler {
	return &Handler{uc: uc, jwtSecret: jwtSecret, hub: hub}
}

func (h *Handler) authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || len(authHeader) < 8 {
			response.Err(w, http.StatusUnauthorized, "отсутствует или неверный заголовок авторизации")
			return
		}
		tokenString := authHeader[7:]
		claims, err := auth.ParseAccessToken(tokenString, h.jwtSecret)
		if err != nil {
			response.Err(w, http.StatusUnauthorized, "недействительный токен")
			return
		}
		userID, err := uuid.Parse(claims.UserID)
		if err != nil {
			response.Err(w, http.StatusUnauthorized, "недействительный токен")
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
		r.Get("/accounts/by-number/{accountNumber}", h.getAccountByNumber)
		r.Delete("/accounts/{accountId}", h.closeAccount)
		r.Post("/accounts/{accountId}/deposit", h.deposit)
		r.Post("/accounts/{accountId}/withdraw", h.withdraw)
		r.Post("/accounts/transfer", h.transfer)
		r.Post("/accounts/transfer/preview", h.previewTransfer)
		r.Get("/accounts/{accountId}/operations", h.listOperations)
		r.Get("/ws/accounts/{accountId}/operations", h.wsOperations)
	})
}

func (h *Handler) openAccount(w http.ResponseWriter, r *http.Request) {
	userID, userType := userFromContext(r.Context())
	if userID == nil {
		response.Err(w, http.StatusUnauthorized, "требуется авторизация")
		return
	}
	var body struct {
		ClientID string `json:"client_id"`
		Currency string `json:"currency"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.Err(w, http.StatusBadRequest, "неверное тело запроса")
		return
	}
	clientID, err := uuid.Parse(body.ClientID)
	if err != nil {
		response.Err(w, http.StatusBadRequest, "неверный client_id")
		return
	}
	if userType == auth.UserTypeClient && *userID != clientID {
		response.Err(w, http.StatusForbidden, "доступ запрещён")
		return
	}
	currency := entity.CurrencyRUB
	if body.Currency != "" {
		currency = entity.Currency(body.Currency)
	}
	acc, err := h.uc.OpenAccount(clientID, currency)
	if err != nil {
		response.Err(w, http.StatusBadRequest, err.Error())
		return
	}
	response.JSON(w, http.StatusCreated, toAccountResp(acc))
}

func (h *Handler) listAccounts(w http.ResponseWriter, r *http.Request) {
	userID, userType := userFromContext(r.Context())
	if userID == nil {
		response.Err(w, http.StatusUnauthorized, "требуется авторизация")
		return
	}
	var clientID *uuid.UUID
	if userType == auth.UserTypeClient {
		clientID = userID
	} else {
		if c := r.URL.Query().Get("client_id"); c != "" {
			parsed, err := uuid.Parse(c)
			if err != nil {
				response.Err(w, http.StatusBadRequest, "неверный client_id")
				return
			}
			clientID = &parsed
		}
	}
	var status *entity.AccountStatus
	if s := r.URL.Query().Get("status"); s != "" {
		st := entity.AccountStatus(s)
		if st != entity.AccountStatusActive && st != entity.AccountStatusClosed {
			response.Err(w, http.StatusBadRequest, "неверный status")
			return
		}
		status = &st
	}
	pageSize := 50
	if p := r.URL.Query().Get("page_size"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			pageSize = v
		}
	}
	page := 1
	if pg := r.URL.Query().Get("page"); pg != "" {
		if v, err := strconv.Atoi(pg); err == nil && v > 0 {
			page = v
		}
	}
	offset := (page - 1) * pageSize
	list, total, err := h.uc.List(clientID, status, pageSize, offset)
	if err != nil {
		response.Err(w, http.StatusInternalServerError, err.Error())
		return
	}
	totalPages := (total + int64(pageSize) - 1) / int64(pageSize)
	if totalPages == 0 {
		totalPages = 1
	}
	res := make([]accountResp, len(list))
	for i, a := range list {
		res[i] = toAccountResp(a)
	}
	response.JSON(w, http.StatusOK, accountListResp{
		Accounts:     res,
		PageNumber:   page,
		PageQuantity: int(totalPages),
	})
}

func (h *Handler) getAccount(w http.ResponseWriter, r *http.Request) {
	userID, userType := userFromContext(r.Context())
	if userID == nil {
		response.Err(w, http.StatusUnauthorized, "требуется авторизация")
		return
	}
	accountID, err := uuid.Parse(chi.URLParam(r, "accountId"))
	if err != nil {
		response.Err(w, http.StatusBadRequest, "неверный accountId")
		return
	}
	acc, err := h.uc.GetByID(accountID)
	if err != nil {
		response.Err(w, http.StatusNotFound, "счёт не найден")
		return
	}
	if userType == auth.UserTypeClient && acc.ClientID != *userID {
		response.Err(w, http.StatusForbidden, "доступ запрещён")
		return
	}
	response.JSON(w, http.StatusOK, toAccountResp(acc))
}

func (h *Handler) getAccountByNumber(w http.ResponseWriter, r *http.Request) {
	userID, _ := userFromContext(r.Context())
	if userID == nil {
		response.Err(w, http.StatusUnauthorized, "требуется авторизация")
		return
	}
	accountNumber := chi.URLParam(r, "accountNumber")
	if accountNumber == "" {
		response.Err(w, http.StatusBadRequest, "неверный accountNumber")
		return
	}
	acc, err := h.uc.GetByNumber(accountNumber)
	if err != nil {
		response.Err(w, http.StatusNotFound, "счёт не найден")
		return
	}
	response.JSON(w, http.StatusOK, accountBasicResp{
		ID:            acc.ID.String(),
		AccountNumber: acc.AccountNumber,
		Currency:      string(acc.Currency),
		Status:        string(acc.Status),
	})
}

func (h *Handler) closeAccount(w http.ResponseWriter, r *http.Request) {
	userID, _ := userFromContext(r.Context())
	if userID == nil {
		response.Err(w, http.StatusUnauthorized, "требуется авторизация")
		return
	}
	accountID, err := uuid.Parse(chi.URLParam(r, "accountId"))
	if err != nil {
		response.Err(w, http.StatusBadRequest, "неверный accountId")
		return
	}
	clientIDStr := r.URL.Query().Get("client_id")
	if clientIDStr == "" {
		response.Err(w, http.StatusBadRequest, "обязателен параметр client_id")
		return
	}
	clientID, err := uuid.Parse(clientIDStr)
	if err != nil {
		response.Err(w, http.StatusBadRequest, "неверный client_id")
		return
	}
	if *userID != clientID {
		response.Err(w, http.StatusForbidden, "доступ запрещён")
		return
	}
	err = h.uc.CloseAccount(accountID, clientID)
	if err != nil {
		if err == usecase.ErrAccountNotFound {
			response.Err(w, http.StatusNotFound, "счёт не найден")
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
		response.Err(w, http.StatusUnauthorized, "требуется авторизация")
		return
	}
	accountID, err := uuid.Parse(chi.URLParam(r, "accountId"))
	if err != nil {
		response.Err(w, http.StatusBadRequest, "неверный accountId")
		return
	}
	acc, err := h.uc.GetByID(accountID)
	if err != nil {
		response.Err(w, http.StatusNotFound, "счёт не найден")
		return
	}
	if userType == auth.UserTypeClient && acc.ClientID != *userID {
		response.Err(w, http.StatusForbidden, "доступ запрещён")
		return
	}
	var body struct {
		Amount float64 `json:"amount"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.Err(w, http.StatusBadRequest, "неверное тело запроса")
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
		response.Err(w, http.StatusUnauthorized, "требуется авторизация")
		return
	}
	accountID, err := uuid.Parse(chi.URLParam(r, "accountId"))
	if err != nil {
		response.Err(w, http.StatusBadRequest, "неверный accountId")
		return
	}
	acc, err := h.uc.GetByID(accountID)
	if err != nil {
		response.Err(w, http.StatusNotFound, "счёт не найден")
		return
	}
	if userType == auth.UserTypeClient && acc.ClientID != *userID {
		response.Err(w, http.StatusForbidden, "доступ запрещён")
		return
	}
	var body struct {
		Amount float64 `json:"amount"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.Err(w, http.StatusBadRequest, "неверное тело запроса")
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

func (h *Handler) transfer(w http.ResponseWriter, r *http.Request) {
	userID, userType := userFromContext(r.Context())
	if userID == nil {
		response.Err(w, http.StatusUnauthorized, "требуется авторизация")
		return
	}
	var body struct {
		FromAccountID   string  `json:"from_account_id"`
		ToAccountID     string  `json:"to_account_id"`
		ToAccountNumber string  `json:"to_account_number"`
		Amount          float64 `json:"amount"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.Err(w, http.StatusBadRequest, "неверное тело запроса")
		return
	}
	fromAccountID, err := uuid.Parse(body.FromAccountID)
	if err != nil {
		response.Err(w, http.StatusBadRequest, "неверный from_account_id")
		return
	}
	var toAccountID uuid.UUID
	if body.ToAccountID != "" {
		toAccountID, err = uuid.Parse(body.ToAccountID)
		if err != nil {
			response.Err(w, http.StatusBadRequest, "неверный to_account_id")
			return
		}
	} else if body.ToAccountNumber != "" {
		toAcc, err := h.uc.GetByNumber(body.ToAccountNumber)
		if err != nil {
			response.Err(w, http.StatusNotFound, "счёт не найден")
			return
		}
		toAccountID = toAcc.ID
	} else {
		response.Err(w, http.StatusBadRequest, "обязателен to_account_id или to_account_number")
		return
	}
	fromAcc, err := h.uc.GetByID(fromAccountID)
	if err != nil {
		response.Err(w, http.StatusNotFound, "счёт не найден")
		return
	}
	if userType == auth.UserTypeClient && fromAcc.ClientID != *userID {
		response.Err(w, http.StatusForbidden, "доступ запрещён")
		return
	}
	outOp, inOp, err := h.uc.Transfer(fromAccountID, toAccountID, body.Amount, "перевод между счетами")
	if err != nil {
		if err == usecase.ErrInvalidAmount || err == usecase.ErrInsufficientFunds || err == usecase.ErrAccountClosed {
			response.Err(w, http.StatusBadRequest, err.Error())
			return
		}
		if err == usecase.ErrAccountNotFound {
			response.Err(w, http.StatusNotFound, "счёт не найден")
			return
		}
		response.Err(w, http.StatusBadRequest, err.Error())
		return
	}
	response.JSON(w, http.StatusOK, map[string]any{
		"debit_operation":  toOperationResp(outOp),
		"credit_operation": toOperationResp(inOp),
	})
}

func (h *Handler) previewTransfer(w http.ResponseWriter, r *http.Request) {
	userID, userType := userFromContext(r.Context())
	if userID == nil {
		response.Err(w, http.StatusUnauthorized, "требуется авторизация")
		return
	}
	var body struct {
		FromAccountID   string  `json:"from_account_id"`
		ToAccountID     string  `json:"to_account_id"`
		ToAccountNumber string  `json:"to_account_number"`
		Amount          float64 `json:"amount"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.Err(w, http.StatusBadRequest, "неверное тело запроса")
		return
	}
	fromAccountID, err := uuid.Parse(body.FromAccountID)
	if err != nil {
		response.Err(w, http.StatusBadRequest, "неверный from_account_id")
		return
	}
	fromAcc, err := h.uc.GetByID(fromAccountID)
	if err != nil {
		response.Err(w, http.StatusNotFound, "счёт не найден")
		return
	}
	if userType == auth.UserTypeClient && fromAcc.ClientID != *userID {
		response.Err(w, http.StatusForbidden, "доступ запрещён")
		return
	}
	var toAccountID uuid.UUID
	if body.ToAccountID != "" {
		toAccountID, err = uuid.Parse(body.ToAccountID)
		if err != nil {
			response.Err(w, http.StatusBadRequest, "неверный to_account_id")
			return
		}
	} else if body.ToAccountNumber != "" {
		toAcc, err := h.uc.GetByNumber(body.ToAccountNumber)
		if err != nil {
			response.Err(w, http.StatusNotFound, "счёт не найден")
			return
		}
		toAccountID = toAcc.ID
	} else {
		response.Err(w, http.StatusBadRequest, "обязателен to_account_id или to_account_number")
		return
	}
	quote, err := h.uc.PreviewTransfer(fromAccountID, toAccountID, body.Amount)
	if err != nil {
		if err == usecase.ErrAccountNotFound {
			response.Err(w, http.StatusNotFound, "счёт не найден")
			return
		}
		response.Err(w, http.StatusBadRequest, err.Error())
		return
	}
	response.JSON(w, http.StatusOK, quote)
}

func (h *Handler) listOperations(w http.ResponseWriter, r *http.Request) {
	userID, userType := userFromContext(r.Context())
	if userID == nil {
		response.Err(w, http.StatusUnauthorized, "требуется авторизация")
		return
	}
	accountID, err := uuid.Parse(chi.URLParam(r, "accountId"))
	if err != nil {
		response.Err(w, http.StatusBadRequest, "неверный accountId")
		return
	}
	acc, err := h.uc.GetByID(accountID)
	if err != nil {
		response.Err(w, http.StatusNotFound, "счёт не найден")
		return
	}
	if userType == auth.UserTypeClient && acc.ClientID != *userID {
		response.Err(w, http.StatusForbidden, "доступ запрещён")
		return
	}
	pageSize := 50
	if p := r.URL.Query().Get("page_size"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			pageSize = v
		}
	}
	page := 1
	if pg := r.URL.Query().Get("page"); pg != "" {
		if v, err := strconv.Atoi(pg); err == nil && v > 0 {
			page = v
		}
	}
	offset := (page - 1) * pageSize
	list, total, err := h.uc.ListOperations(accountID, pageSize, offset)
	if err != nil {
		response.Err(w, http.StatusInternalServerError, err.Error())
		return
	}
	totalPages := (total + int64(pageSize) - 1) / int64(pageSize)
	if totalPages == 0 {
		totalPages = 1
	}
	res := make([]operationResp, len(list))
	for i, o := range list {
		res[i] = toOperationResp(o)
	}
	response.JSON(w, http.StatusOK, operationListResp{
		Operations:   res,
		PageNumber:   page,
		PageQuantity: int(totalPages),
	})
}

var wsUpgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func (h *Handler) wsOperations(w http.ResponseWriter, r *http.Request) {
	userID, userType := userFromContext(r.Context())
	if userID == nil {
		response.Err(w, http.StatusUnauthorized, "требуется авторизация")
		return
	}
	accountID, err := uuid.Parse(chi.URLParam(r, "accountId"))
	if err != nil {
		response.Err(w, http.StatusBadRequest, "неверный accountId")
		return
	}
	acc, err := h.uc.GetByID(accountID)
	if err != nil {
		response.Err(w, http.StatusNotFound, "счёт не найден")
		return
	}
	if userType == auth.UserTypeClient && acc.ClientID != *userID {
		response.Err(w, http.StatusForbidden, "доступ запрещён")
		return
	}
	conn, err := wsUpgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	pageSize := 50
	if p := r.URL.Query().Get("page_size"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			pageSize = v
		}
	}
	page := 1
	if pg := r.URL.Query().Get("page"); pg != "" {
		if v, err := strconv.Atoi(pg); err == nil && v > 0 {
			page = v
		}
	}
	offset := (page - 1) * pageSize
	list, total, err := h.uc.ListOperations(accountID, pageSize, offset)
	if err != nil {
		_ = conn.WriteJSON(map[string]any{"type": "error", "error": err.Error()})
		return
	}
	totalPages := (total + int64(pageSize) - 1) / int64(pageSize)
	if totalPages == 0 {
		totalPages = 1
	}
	snapshot := make([]operationResp, len(list))
	for i, o := range list {
		snapshot[i] = toOperationResp(o)
	}
	if err := conn.WriteJSON(map[string]any{
		"type":          "operations_snapshot",
		"operations":    snapshot,
		"page_number":   page,
		"page_quantity": int(totalPages),
	}); err != nil {
		return
	}
	if h.hub == nil {
		return
	}
	sub := h.hub.Subscribe(accountID)
	defer h.hub.Unsubscribe(accountID, sub)
	for op := range sub {
		if err := conn.WriteJSON(map[string]any{
			"type":      "operation_created",
			"operation": toOperationResp(op),
		}); err != nil {
			return
		}
	}
}

type accountResp struct {
	ID            string  `json:"id"`
	AccountNumber string  `json:"account_number,omitempty"`
	ClientID      string  `json:"client_id"`
	Balance       float64 `json:"balance"`
	Currency      string  `json:"currency,omitempty"`
	Status        string  `json:"status"`
	OpenedAt      string  `json:"opened_at"`
	ClosedAt      *string `json:"closed_at,omitempty"`
}

type accountBasicResp struct {
	ID            string `json:"id"`
	AccountNumber string `json:"account_number"`
	Currency      string `json:"currency"`
	Status        string `json:"status"`
}

type accountListResp struct {
	Accounts     []accountResp `json:"accounts"`
	PageNumber   int           `json:"pageNumber"`
	PageQuantity int           `json:"pageQuantity"`
}

type operationListResp struct {
	Operations   []operationResp `json:"operations"`
	PageNumber   int             `json:"pageNumber"`
	PageQuantity int             `json:"pageQuantity"`
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
		ID:            a.ID.String(),
		AccountNumber: a.AccountNumber,
		ClientID:      a.ClientID.String(),
		Balance:       a.Balance,
		Currency:      string(a.Currency),
		Status:        string(a.Status),
		OpenedAt:      a.OpenedAt.Format("2006-01-02T15:04:05.000Z07:00"),
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
