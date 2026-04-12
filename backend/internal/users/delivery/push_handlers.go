package delivery

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"internet-bank/internal/users/entity"
	"internet-bank/pkg/auth"
	"internet-bank/pkg/response"

	"github.com/google/uuid"
)

func (h *Handler) internalTokenMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.TrimSpace(r.Header.Get("X-Internal-Token")) != h.jwtSecret {
			response.Err(w, http.StatusUnauthorized, "недоступно")
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (h *Handler) internalClientPushTokens(w http.ResponseWriter, r *http.Request) {
	raw := r.URL.Query().Get("user_id")
	if raw == "" {
		response.Err(w, http.StatusBadRequest, "нужен user_id")
		return
	}
	uid, err := uuid.Parse(raw)
	if err != nil {
		response.Err(w, http.StatusBadRequest, "неверный user_id")
		return
	}
	tokens, err := h.deviceRepo.ListTokensByUserID(uid)
	if err != nil {
		response.Err(w, http.StatusInternalServerError, err.Error())
		return
	}
	response.JSON(w, http.StatusOK, map[string]any{"tokens": tokens})
}

func (h *Handler) internalEmployeePushTokens(w http.ResponseWriter, r *http.Request) {
	tokens, err := h.deviceRepo.ListTokensByRole("employee")
	if err != nil {
		response.Err(w, http.StatusInternalServerError, err.Error())
		return
	}
	response.JSON(w, http.StatusOK, map[string]any{"tokens": tokens})
}

func (h *Handler) registerPushDevice(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Token    string `json:"token"`
		Platform string `json:"platform"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.Err(w, http.StatusBadRequest, "неверное тело запроса")
		return
	}
	body.Token = strings.TrimSpace(body.Token)
	if body.Token == "" {
		response.Err(w, http.StatusBadRequest, "нужен token")
		return
	}
	userID, userType := userFromContext(r.Context())
	if userID == nil {
		response.Err(w, http.StatusUnauthorized, "нет пользователя")
		return
	}
	role := "client"
	if userType == auth.UserTypeEmployee {
		role = "employee"
	}
	row := &entity.DevicePushToken{
		ID:        uuid.New(),
		UserID:    *userID,
		Token:     body.Token,
		Role:      role,
		Platform:  body.Platform,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	if err := h.deviceRepo.Upsert(row); err != nil {
		response.Err(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
