package delivery

import (
	"encoding/json"
	"net/http"
	"strconv"

	"internet-bank/internal/credits/entity"
	"internet-bank/internal/credits/usecase"
	"internet-bank/pkg/auth"
	"internet-bank/pkg/response"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type TariffUseCase interface {
	Create(name string, rate, minAmount, maxAmount float64) (*entity.CreditTariff, error)
	List(limit, offset int) ([]*entity.CreditTariff, int64, error)
}

type CreditUseCase interface {
	Issue(clientID, accountID, tariffID uuid.UUID, amount float64, bearerToken string) (*entity.Credit, error)
	GetByID(id uuid.UUID) (*entity.Credit, error)
	ListByClientID(clientID uuid.UUID, limit, offset int) ([]*entity.Credit, int64, error)
	Repay(creditID uuid.UUID, accountID uuid.UUID, amount float64, userID uuid.UUID, bearerToken string) (*entity.Credit, error)
	GetOverdue(creditID uuid.UUID) (*usecase.CreditOverdue, error)
	GetPayments(creditID uuid.UUID, page, pageSize int, onlyOverdue bool) (*usecase.CreditPaymentList, error)
	GetClientRating(clientID uuid.UUID) (*usecase.CreditRating, error)
}

type Handler struct {
	tariffUC  TariffUseCase
	creditUC  CreditUseCase
	jwtSecret string
}

func NewHandler(tariffUC TariffUseCase, creditUC CreditUseCase, jwtSecret string) *Handler {
	return &Handler{tariffUC: tariffUC, creditUC: creditUC, jwtSecret: jwtSecret}
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
		ctx := withUser(r.Context(), userID, claims.UserType, authHeader)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (h *Handler) employeeOnly(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, userType, _ := userFromContext(r.Context())
		if userType != auth.UserTypeEmployee {
			response.Err(w, http.StatusForbidden, "только для сотрудника")
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (h *Handler) Mount(r chi.Router) {
	r.Group(func(r chi.Router) {
		r.Use(h.authMiddleware)
		r.Get("/tariffs", h.listTariffs)
		r.Get("/credits", h.listCredits)
		r.Post("/credits", h.issueCredit)
		r.Get("/credits/{creditId}", h.getCredit)
		r.Get("/credits/{creditId}/overdue", h.getCreditOverdue)
		r.Get("/credits/{creditId}/payments", h.getCreditPayments)
		r.Get("/clients/{clientId}/credit-rating", h.getClientRating)
		r.Post("/credits/{creditId}/repay", h.repayCredit)
	})

	r.Group(func(r chi.Router) {
		r.Use(h.authMiddleware, h.employeeOnly)
		r.Post("/tariffs", h.createTariff)
	})
}

func (h *Handler) createTariff(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Name      string  `json:"name"`
		Rate      float64 `json:"rate"`
		MinAmount float64 `json:"min_amount"`
		MaxAmount float64 `json:"max_amount"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.Err(w, http.StatusBadRequest, "неверное тело запроса")
		return
	}
	tariff, err := h.tariffUC.Create(body.Name, body.Rate, body.MinAmount, body.MaxAmount)
	if err != nil {
		response.Err(w, http.StatusInternalServerError, err.Error())
		return
	}
	response.JSON(w, http.StatusCreated, toTariffResp(tariff))
}

func (h *Handler) listTariffs(w http.ResponseWriter, r *http.Request) {
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
	list, total, err := h.tariffUC.List(pageSize, offset)
	if err != nil {
		response.Err(w, http.StatusInternalServerError, err.Error())
		return
	}
	totalPages := (total + int64(pageSize) - 1) / int64(pageSize)
	if totalPages == 0 {
		totalPages = 1
	}
	res := make([]tariffResp, len(list))
	for i, t := range list {
		res[i] = toTariffResp(t)
	}
	response.JSON(w, http.StatusOK, tariffListResp{
		Tariffs:      res,
		PageNumber:   page,
		PageQuantity: int(totalPages),
	})
}

func (h *Handler) issueCredit(w http.ResponseWriter, r *http.Request) {
	userID, userType, bearer := userFromContext(r.Context())
	if userID == nil {
		response.Err(w, http.StatusUnauthorized, "требуется авторизация")
		return
	}
	var body struct {
		ClientID  string  `json:"client_id"`
		AccountID string  `json:"account_id"`
		TariffID  string  `json:"tariff_id"`
		Amount    float64 `json:"amount"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.Err(w, http.StatusBadRequest, "неверное тело запроса")
		return
	}
	clientID, _ := uuid.Parse(body.ClientID)
	accountID, _ := uuid.Parse(body.AccountID)
	tariffID, _ := uuid.Parse(body.TariffID)
	if clientID == uuid.Nil || accountID == uuid.Nil || tariffID == uuid.Nil {
		response.Err(w, http.StatusBadRequest, "неверные id")
		return
	}
	if userType == auth.UserTypeClient && *userID != clientID {
		response.Err(w, http.StatusForbidden, "доступ запрещён")
		return
	}
	credit, err := h.creditUC.Issue(clientID, accountID, tariffID, body.Amount, bearer)
	if err != nil {
		writeIssueCreditError(w, err)
		return
	}
	response.JSON(w, http.StatusCreated, toCreditResp(credit))
}

func (h *Handler) listCredits(w http.ResponseWriter, r *http.Request) {
	userID, userType, _ := userFromContext(r.Context())
	if userID == nil {
		response.Err(w, http.StatusUnauthorized, "требуется авторизация")
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
	if userType == auth.UserTypeClient && *userID != clientID {
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
	list, total, err := h.creditUC.ListByClientID(clientID, pageSize, offset)
	if err != nil {
		response.Err(w, http.StatusInternalServerError, err.Error())
		return
	}
	totalPages := (total + int64(pageSize) - 1) / int64(pageSize)
	if totalPages == 0 {
		totalPages = 1
	}
	res := make([]creditResp, len(list))
	for i, c := range list {
		res[i] = toCreditResp(c)
	}
	response.JSON(w, http.StatusOK, creditListResp{
		Credits:      res,
		PageNumber:   page,
		PageQuantity: int(totalPages),
	})
}

func (h *Handler) getCredit(w http.ResponseWriter, r *http.Request) {
	userID, userType, _ := userFromContext(r.Context())
	if userID == nil {
		response.Err(w, http.StatusUnauthorized, "требуется авторизация")
		return
	}
	creditID, err := uuid.Parse(chi.URLParam(r, "creditId"))
	if err != nil {
		response.Err(w, http.StatusBadRequest, "неверный creditId")
		return
	}
	credit, err := h.creditUC.GetByID(creditID)
	if err != nil {
		response.Err(w, http.StatusNotFound, "кредит не найден")
		return
	}
	if userType == auth.UserTypeClient && credit.ClientID != *userID {
		response.Err(w, http.StatusForbidden, "доступ запрещён")
		return
	}
	response.JSON(w, http.StatusOK, toCreditResp(credit))
}

func (h *Handler) repayCredit(w http.ResponseWriter, r *http.Request) {
	userID, userType, bearer := userFromContext(r.Context())
	if userID == nil {
		response.Err(w, http.StatusUnauthorized, "требуется авторизация")
		return
	}
	creditID, err := uuid.Parse(chi.URLParam(r, "creditId"))
	if err != nil {
		response.Err(w, http.StatusBadRequest, "неверный creditId")
		return
	}
	credit, err := h.creditUC.GetByID(creditID)
	if err != nil {
		response.Err(w, http.StatusNotFound, "кредит не найден")
		return
	}
	if userType == auth.UserTypeClient && credit.ClientID != *userID {
		response.Err(w, http.StatusForbidden, "доступ запрещён")
		return
	}
	var body struct {
		Amount    float64 `json:"amount"`
		AccountID string  `json:"account_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.Err(w, http.StatusBadRequest, "неверное тело запроса")
		return
	}
	if body.AccountID == "" {
		response.Err(w, http.StatusBadRequest, "обязателен параметр account_id")
		return
	}
	accountID, err := uuid.Parse(body.AccountID)
	if err != nil {
		response.Err(w, http.StatusBadRequest, "неверный account_id")
		return
	}
	credit, err = h.creditUC.Repay(creditID, accountID, body.Amount, *userID, bearer)
	if err != nil {
		writeRepayCreditError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, toCreditResp(credit))
}

func (h *Handler) getCreditOverdue(w http.ResponseWriter, r *http.Request) {
	userID, userType, _ := userFromContext(r.Context())
	if userID == nil {
		response.Err(w, http.StatusUnauthorized, "требуется авторизация")
		return
	}
	creditID, err := uuid.Parse(chi.URLParam(r, "creditId"))
	if err != nil {
		response.Err(w, http.StatusBadRequest, "неверный creditId")
		return
	}
	credit, err := h.creditUC.GetByID(creditID)
	if err != nil {
		response.Err(w, http.StatusNotFound, "кредит не найден")
		return
	}
	if userType == auth.UserTypeClient && credit.ClientID != *userID {
		response.Err(w, http.StatusForbidden, "доступ запрещён")
		return
	}
	overdue, err := h.creditUC.GetOverdue(creditID)
	if err != nil {
		response.Err(w, http.StatusBadRequest, err.Error())
		return
	}
	response.JSON(w, http.StatusOK, overdue)
}

func (h *Handler) getCreditPayments(w http.ResponseWriter, r *http.Request) {
	userID, userType, _ := userFromContext(r.Context())
	if userID == nil {
		response.Err(w, http.StatusUnauthorized, "требуется авторизация")
		return
	}
	creditID, err := uuid.Parse(chi.URLParam(r, "creditId"))
	if err != nil {
		response.Err(w, http.StatusBadRequest, "неверный creditId")
		return
	}
	credit, err := h.creditUC.GetByID(creditID)
	if err != nil {
		response.Err(w, http.StatusNotFound, "кредит не найден")
		return
	}
	if userType == auth.UserTypeClient && credit.ClientID != *userID {
		response.Err(w, http.StatusForbidden, "доступ запрещён")
		return
	}
	page := 1
	if p := r.URL.Query().Get("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			page = v
		}
	}
	pageSize := 50
	if p := r.URL.Query().Get("page_size"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			pageSize = v
		}
	}
	onlyOverdue := false
	if v := r.URL.Query().Get("only_overdue"); v == "1" || v == "true" {
		onlyOverdue = true
	}
	out, err := h.creditUC.GetPayments(creditID, page, pageSize, onlyOverdue)
	if err != nil {
		response.Err(w, http.StatusBadRequest, err.Error())
		return
	}
	response.JSON(w, http.StatusOK, out)
}

func (h *Handler) getClientRating(w http.ResponseWriter, r *http.Request) {
	userID, userType, _ := userFromContext(r.Context())
	if userID == nil {
		response.Err(w, http.StatusUnauthorized, "требуется авторизация")
		return
	}
	clientID, err := uuid.Parse(chi.URLParam(r, "clientId"))
	if err != nil {
		response.Err(w, http.StatusBadRequest, "неверный clientId")
		return
	}
	if userType == auth.UserTypeClient && *userID != clientID {
		response.Err(w, http.StatusForbidden, "доступ запрещён")
		return
	}
	rating, err := h.creditUC.GetClientRating(clientID)
	if err != nil {
		response.Err(w, http.StatusBadRequest, err.Error())
		return
	}
	response.JSON(w, http.StatusOK, rating)
}

type tariffResp struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	Rate      float64 `json:"rate"`
	MinAmount float64 `json:"min_amount,omitempty"`
	MaxAmount float64 `json:"max_amount,omitempty"`
}

type tariffListResp struct {
	Tariffs      []tariffResp `json:"tariffs"`
	PageNumber   int          `json:"pageNumber"`
	PageQuantity int          `json:"pageQuantity"`
}

type creditResp struct {
	ID           string  `json:"id"`
	ClientID     string  `json:"client_id"`
	AccountID    string  `json:"account_id"`
	TariffID     string  `json:"tariff_id"`
	Amount       float64 `json:"amount"`
	Remaining    float64 `json:"remaining"`
	Rate         float64 `json:"rate"`
	DailyPayment float64 `json:"daily_payment"`
	IssuedAt     string  `json:"issued_at"`
	Status       string  `json:"status"`
}

type creditListResp struct {
	Credits      []creditResp `json:"credits"`
	PageNumber   int          `json:"pageNumber"`
	PageQuantity int          `json:"pageQuantity"`
}

func toTariffResp(t *entity.CreditTariff) tariffResp {
	return tariffResp{
		ID:        t.ID.String(),
		Name:      t.Name,
		Rate:      t.Rate,
		MinAmount: t.MinAmount,
		MaxAmount: t.MaxAmount,
	}
}

func toCreditResp(c *entity.Credit) creditResp {
	return creditResp{
		ID:           c.ID.String(),
		ClientID:     c.ClientID.String(),
		AccountID:    c.AccountID.String(),
		TariffID:     c.TariffID.String(),
		Amount:       c.Amount,
		Remaining:    c.Remaining,
		Rate:         c.Rate,
		DailyPayment: c.DailyPayment,
		IssuedAt:     c.IssuedAt.Format("2006-01-02T15:04:05.000Z07:00"),
		Status:       string(c.Status),
	}
}

func parseLimitOffset(r *http.Request, defaultLimit, defaultOffset int) (limit, offset int) {
	limit = defaultLimit
	if l := r.URL.Query().Get("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil && v > 0 {
			limit = v
		}
	}
	offset = defaultOffset
	if o := r.URL.Query().Get("offset"); o != "" {
		if v, err := strconv.Atoi(o); err == nil && v >= 0 {
			offset = v
		}
	}
	return limit, offset
}
