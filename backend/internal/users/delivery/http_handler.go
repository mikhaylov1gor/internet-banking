package delivery

import (
	"encoding/json"
	"net/http"
	"strconv"

	"internet-bank/internal/users/entity"
	"internet-bank/internal/users/usecase"
	"internet-bank/pkg/auth"
	"internet-bank/pkg/response"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

const defaultPassword = "changeme"

type AuthUseCase interface {
	Login(email, password string) (accessToken, refreshToken string, user *entity.User, err error)
	Refresh(refreshToken string) (accessToken, newRefreshToken string, user *entity.User, err error)
}

type UserUseCase interface {
	Create(userType entity.UserType, email, fullName, phone, password string) (*entity.User, error)
	GetByID(id uuid.UUID) (*entity.User, error)
	List(userType *entity.UserType, status *entity.UserStatus, limit, offset int) ([]*entity.User, int64, error)
	Block(userID uuid.UUID) error
	Unblock(userID uuid.UUID) error
}

type Handler struct {
	authUC    AuthUseCase
	userUC    UserUseCase
	jwtSecret string
}

func NewHandler(authUC AuthUseCase, userUC UserUseCase, jwtSecret string) *Handler {
	return &Handler{authUC: authUC, userUC: userUC, jwtSecret: jwtSecret}
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

func (h *Handler) employeeOnly(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, userType := userFromContext(r.Context())
		if userType != auth.UserTypeEmployee {
			response.Err(w, http.StatusForbidden, "только для сотрудника")
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (h *Handler) Mount(r chi.Router) {
	r.Post("/auth/login", h.login)
	r.Post("/auth/refresh", h.refresh)

	r.Group(func(r chi.Router) {
		r.Use(h.authMiddleware, h.employeeOnly)
		r.Post("/users", h.createUser)
		r.Get("/users", h.listUsers)
		r.Get("/users/{userId}", h.getUser)
		r.Patch("/users/{userId}", h.patchUser)
	})
}

func (h *Handler) login(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.Err(w, http.StatusBadRequest, "неверное тело запроса")
		return
	}
	access, refresh, user, err := h.authUC.Login(body.Email, body.Password)
	if err != nil {
		if err == usecase.ErrInvalidCredentials {
			response.Err(w, http.StatusUnauthorized, "неверный логин или пароль")
			return
		}
		if err == usecase.ErrUserBlocked {
			response.Err(w, http.StatusUnauthorized, "пользователь заблокирован")
			return
		}
		response.Err(w, http.StatusInternalServerError, err.Error())
		return
	}
	response.JSON(w, http.StatusOK, map[string]any{
		"token":         access,
		"refresh_token": refresh,
		"user_id":       user.ID.String(),
		"type":          string(user.Type),
	})
}

func (h *Handler) refresh(w http.ResponseWriter, r *http.Request) {
	var body struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.Err(w, http.StatusBadRequest, "неверное тело запроса")
		return
	}
	access, refresh, user, err := h.authUC.Refresh(body.RefreshToken)
	if err != nil {
		if err == usecase.ErrInvalidRefreshToken || err == usecase.ErrUserBlocked {
			response.Err(w, http.StatusUnauthorized, "недействительный или истёкший refresh-токен")
			return
		}
		response.Err(w, http.StatusInternalServerError, err.Error())
		return
	}
	response.JSON(w, http.StatusOK, map[string]any{
		"token":         access,
		"refresh_token": refresh,
		"user_id":       user.ID.String(),
		"type":          string(user.Type),
	})
}

func (h *Handler) createUser(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Type     string `json:"type"`
		Email    string `json:"email"`
		FullName string `json:"full_name"`
		Phone    string `json:"phone"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.Err(w, http.StatusBadRequest, "неверное тело запроса")
		return
	}
	userType := entity.UserType(body.Type)
	if userType != entity.UserTypeClient && userType != entity.UserTypeEmployee {
		response.Err(w, http.StatusBadRequest, "неверный type")
		return
	}
	password := body.Password
	if password == "" {
		password = defaultPassword
	}
	user, err := h.userUC.Create(userType, body.Email, body.FullName, body.Phone, password)
	if err != nil {
		if err == usecase.ErrEmailExists {
			response.Err(w, http.StatusBadRequest, "пользователь с таким email уже существует")
			return
		}
		response.Err(w, http.StatusInternalServerError, err.Error())
		return
	}
	response.JSON(w, http.StatusCreated, toUserResp(user))
}

func (h *Handler) listUsers(w http.ResponseWriter, r *http.Request) {
	var userType *entity.UserType
	if t := r.URL.Query().Get("type"); t != "" {
		ut := entity.UserType(t)
		if ut != entity.UserTypeClient && ut != entity.UserTypeEmployee {
			response.Err(w, http.StatusBadRequest, "неверный type")
			return
		}
		userType = &ut
	}
	var status *entity.UserStatus
	if s := r.URL.Query().Get("status"); s != "" {
		st := entity.UserStatus(s)
		if st != entity.UserStatusActive && st != entity.UserStatusBlocked {
			response.Err(w, http.StatusBadRequest, "неверный status")
			return
		}
		status = &st
	}
	pageSize := 100
	if p := r.URL.Query().Get("page_size"); p != "" {
		if v, err := parseInt(p); err == nil && v > 0 {
			pageSize = v
		}
	}
	page := 1
	if pg := r.URL.Query().Get("page"); pg != "" {
		if v, err := parseInt(pg); err == nil && v > 0 {
			page = v
		}
	}
	offset := (page - 1) * pageSize
	list, total, err := h.userUC.List(userType, status, pageSize, offset)
	if err != nil {
		response.Err(w, http.StatusInternalServerError, err.Error())
		return
	}
	res := make([]userResp, len(list))
	for i, u := range list {
		res[i] = toUserResp(u)
	}
	totalPages := (total + int64(pageSize) - 1) / int64(pageSize)
	if totalPages == 0 {
		totalPages = 1
	}
	response.JSON(w, http.StatusOK, userListResp{
		Users:        res,
		PageNumber:   page,
		PageQuantity: int(totalPages),
	})
}

func (h *Handler) getUser(w http.ResponseWriter, r *http.Request) {
	userID, err := uuid.Parse(chi.URLParam(r, "userId"))
	if err != nil {
		response.Err(w, http.StatusBadRequest, "неверный userId")
		return
	}
	user, err := h.userUC.GetByID(userID)
	if err != nil {
		response.Err(w, http.StatusNotFound, "пользователь не найден")
		return
	}
	response.JSON(w, http.StatusOK, toUserResp(user))
}

func (h *Handler) patchUser(w http.ResponseWriter, r *http.Request) {
	userID, err := uuid.Parse(chi.URLParam(r, "userId"))
	if err != nil {
		response.Err(w, http.StatusBadRequest, "неверный userId")
		return
	}
	action := r.URL.Query().Get("action")
	switch action {
	case "block":
		currentID, _ := userFromContext(r.Context())
		if currentID != nil && *currentID == userID {
			response.Err(w, http.StatusForbidden, "нельзя заблокировать себя")
			return
		}
		err = h.userUC.Block(userID)
	case "unblock":
		err = h.userUC.Unblock(userID)
	default:
		response.Err(w, http.StatusBadRequest, "action должен быть block или unblock")
		return
	}
	if err != nil {
		if err == usecase.ErrUserNotFound {
			response.Err(w, http.StatusNotFound, "пользователь не найден")
			return
		}
		response.Err(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

type userResp struct {
	ID        string `json:"id"`
	Type      string `json:"type"`
	Email     string `json:"email"`
	FullName  string `json:"full_name,omitempty"`
	Phone     string `json:"phone,omitempty"`
	Status    string `json:"status"`
	CreatedAt string `json:"created_at"`
}

type userListResp struct {
	Users        []userResp `json:"users"`
	PageNumber   int        `json:"page_number"`
	PageQuantity int        `json:"page_quantity"`
}

func toUserResp(u *entity.User) userResp {
	return userResp{
		ID:        u.ID.String(),
		Type:      string(u.Type),
		Email:     u.Email,
		FullName:  u.FullName,
		Phone:     u.Phone,
		Status:    string(u.Status),
		CreatedAt: u.CreatedAt.Format("2006-01-02T15:04:05.000Z07:00"),
	}
}

func parseInt(s string) (int, error) {
	return strconv.Atoi(s)
}
