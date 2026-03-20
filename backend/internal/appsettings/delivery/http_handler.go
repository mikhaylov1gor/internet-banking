package delivery

import (
	"encoding/json"
	"net/http"

	"internet-bank/internal/appsettings/usecase"
	"internet-bank/pkg/auth"
	"internet-bank/pkg/response"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type SettingsUseCase interface {
	Get(userID uuid.UUID, appType string) (*usecase.SettingsDTO, error)
	Upsert(userID uuid.UUID, appType, theme string, hiddenAccountIDs []string) (*usecase.SettingsDTO, error)
}

type Handler struct {
	uc        SettingsUseCase
	jwtSecret string
}

func NewHandler(uc SettingsUseCase, jwtSecret string) *Handler {
	return &Handler{uc: uc, jwtSecret: jwtSecret}
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
		r.Get("/app-settings/{appType}", h.getSettings)
		r.Put("/app-settings/{appType}", h.putSettings)
	})
}

func (h *Handler) getSettings(w http.ResponseWriter, r *http.Request) {
	userID, _ := userFromContext(r.Context())
	if userID == nil {
		response.Err(w, http.StatusUnauthorized, "требуется авторизация")
		return
	}
	appType := chi.URLParam(r, "appType")
	out, err := h.uc.Get(*userID, appType)
	if err != nil {
		if err == usecase.ErrInvalidAppType {
			response.Err(w, http.StatusBadRequest, err.Error())
			return
		}
		response.Err(w, http.StatusInternalServerError, err.Error())
		return
	}
	response.JSON(w, http.StatusOK, out)
}

func (h *Handler) putSettings(w http.ResponseWriter, r *http.Request) {
	userID, _ := userFromContext(r.Context())
	if userID == nil {
		response.Err(w, http.StatusUnauthorized, "требуется авторизация")
		return
	}
	appType := chi.URLParam(r, "appType")
	var body struct {
		Theme            string   `json:"theme"`
		HiddenAccountIDs []string `json:"hidden_account_ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.Err(w, http.StatusBadRequest, "неверное тело запроса")
		return
	}
	out, err := h.uc.Upsert(*userID, appType, body.Theme, body.HiddenAccountIDs)
	if err != nil {
		if err == usecase.ErrInvalidAppType || err == usecase.ErrInvalidTheme {
			response.Err(w, http.StatusBadRequest, err.Error())
			return
		}
		response.Err(w, http.StatusInternalServerError, err.Error())
		return
	}
	response.JSON(w, http.StatusOK, out)
}
