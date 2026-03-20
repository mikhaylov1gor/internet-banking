package delivery

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"html/template"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"

	"internet-bank/internal/users/entity"
	"internet-bank/internal/users/usecase"
	"internet-bank/pkg/auth"
	"internet-bank/pkg/response"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

const defaultPassword = "123"

type AuthUseCase interface {
	Login(email, password, roleHint string) (accessToken, refreshToken string, user *entity.User, issuedType auth.UserType, err error)
	Refresh(refreshToken string) (accessToken, newRefreshToken string, user *entity.User, issuedType auth.UserType, err error)
	VerifyCredentials(email, password string) (*entity.User, error)
	GetByID(id uuid.UUID) (*entity.User, error)
	IssueTokensForRole(user *entity.User, userType auth.UserType) (accessToken, refreshToken string, err error)
}

type UserUseCase interface {
	Create(userType entity.UserType, email, fullName, phone, password string) (*entity.User, error)
	GetByID(id uuid.UUID) (*entity.User, error)
	List(userType *entity.UserType, status *entity.UserStatus, limit, offset int) ([]*entity.User, int64, error)
	Block(userID uuid.UUID) error
	Unblock(userID uuid.UUID) error
}

type Handler struct {
	authUC         AuthUseCase
	userUC         UserUseCase
	jwtSecret      string
	forceSecureSSO bool
	ssoClients     map[string]ssoClientConfig
	mu             sync.Mutex
	codes          map[string]authCode
	sessions       map[string]sessionEntry
}

type ssoClientConfig struct {
	Role         auth.UserType
	RedirectURIs map[string]struct{}
}

func NewHandler(authUC AuthUseCase, userUC UserUseCase, jwtSecret string, ssoClientsRaw string, forceSecureSSO bool) *Handler {
	clients := parseSSOClients(ssoClientsRaw)
	return &Handler{
		authUC:         authUC,
		userUC:         userUC,
		jwtSecret:      jwtSecret,
		forceSecureSSO: forceSecureSSO,
		ssoClients:     clients,
		codes:          map[string]authCode{},
		sessions:       map[string]sessionEntry{},
	}
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
	r.Get("/sso/authorize", h.ssoAuthorize)
	r.Get("/sso/login", h.ssoLoginPage)
	r.Post("/sso/login", h.ssoLoginSubmit)
	r.Post("/sso/token", h.ssoToken)

	r.Group(func(r chi.Router) {
		r.Use(h.authMiddleware, h.employeeOnly)
		r.Post("/users", h.createUser)
		r.Get("/users", h.listUsers)
		r.Get("/users/{userId}", h.getUser)
		r.Patch("/users/{userId}", h.patchUser)
	})
}

type authCode struct {
	UserID              uuid.UUID
	ClientID            string
	RedirectURI         string
	CodeChallenge       string
	CodeChallengeMethod string
	ExpiresAt           time.Time
}

type sessionEntry struct {
	UserID    uuid.UUID
	ExpiresAt time.Time
}

func (h *Handler) login(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Role     string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.Err(w, http.StatusBadRequest, "неверное тело запроса")
		return
	}
	access, refresh, user, issuedType, err := h.authUC.Login(body.Email, body.Password, body.Role)
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
		"type":          string(issuedType),
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
	access, refresh, user, issuedType, err := h.authUC.Refresh(body.RefreshToken)
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
		"type":          string(issuedType),
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
	ID        string   `json:"id"`
	Type      string   `json:"type"`
	Roles     []string `json:"roles"`
	Email     string   `json:"email"`
	FullName  string   `json:"full_name,omitempty"`
	Phone     string   `json:"phone,omitempty"`
	Status    string   `json:"status"`
	CreatedAt string   `json:"created_at"`
}

type userListResp struct {
	Users        []userResp `json:"users"`
	PageNumber   int        `json:"page_number"`
	PageQuantity int        `json:"page_quantity"`
}

func toUserResp(u *entity.User) userResp {
	roles := u.GetRoles()
	rolesOut := make([]string, len(roles))
	for i, r := range roles {
		rolesOut[i] = string(r)
	}
	return userResp{
		ID:        u.ID.String(),
		Type:      string(u.Type),
		Roles:     rolesOut,
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

func parseSSOClients(raw string) map[string]ssoClientConfig {
	out := map[string]ssoClientConfig{}
	items := strings.Split(raw, ",")
	for _, item := range items {
		item = strings.TrimSpace(item)
		if item == "" {
			continue
		}
		parts := strings.Split(item, "|")
		if len(parts) < 3 {
			continue
		}
		clientID := strings.TrimSpace(parts[0])
		role := auth.UserType(strings.TrimSpace(parts[1]))
		redirectURI := strings.TrimSpace(parts[2])
		if clientID == "" || redirectURI == "" {
			continue
		}
		if role != auth.UserTypeClient && role != auth.UserTypeEmployee {
			continue
		}
		cfg, ok := out[clientID]
		if !ok {
			cfg = ssoClientConfig{
				Role:         role,
				RedirectURIs: map[string]struct{}{},
			}
		}
		cfg.RedirectURIs[redirectURI] = struct{}{}
		out[clientID] = cfg
	}
	return out
}

func (h *Handler) validateSSOAuthParams(p ssoAuthParams) (ssoClientConfig, error) {
	if p.ResponseType != "code" {
		return ssoClientConfig{}, usecase.ErrInvalidCredentials
	}
	if p.ClientID == "" || p.RedirectURI == "" {
		return ssoClientConfig{}, usecase.ErrInvalidCredentials
	}
	if p.CodeChallenge == "" || strings.ToUpper(p.CodeChallengeMethod) != "S256" {
		return ssoClientConfig{}, usecase.ErrInvalidCredentials
	}
	clientCfg, ok := h.ssoClients[p.ClientID]
	if !ok {
		return ssoClientConfig{}, usecase.ErrInvalidCredentials
	}
	if _, ok := clientCfg.RedirectURIs[p.RedirectURI]; !ok {
		return ssoClientConfig{}, usecase.ErrInvalidCredentials
	}
	return clientCfg, nil
}

func (h *Handler) shouldSetSecureCookie(r *http.Request) bool {
	if h.forceSecureSSO {
		return true
	}
	if r.TLS != nil {
		return true
	}
	return strings.EqualFold(r.Header.Get("X-Forwarded-Proto"), "https")
}

type ssoAuthParams struct {
	ResponseType        string
	ClientID            string
	RedirectURI         string
	State               string
	CodeChallenge       string
	CodeChallengeMethod string
}

func readSSOAuthParams(r *http.Request) ssoAuthParams {
	q := r.URL.Query()
	return ssoAuthParams{
		ResponseType:        q.Get("response_type"),
		ClientID:            q.Get("client_id"),
		RedirectURI:         q.Get("redirect_uri"),
		State:               q.Get("state"),
		CodeChallenge:       q.Get("code_challenge"),
		CodeChallengeMethod: q.Get("code_challenge_method"),
	}
}

func (h *Handler) ssoAuthorize(w http.ResponseWriter, r *http.Request) {
	p := readSSOAuthParams(r)
	if _, err := h.validateSSOAuthParams(p); err != nil {
		response.Err(w, http.StatusBadRequest, "неверные параметры SSO")
		return
	}
	if userID, ok := h.sessionUserID(r); ok {
		h.redirectWithCode(w, r, userID, p)
		return
	}
	http.Redirect(w, r, "/sso/login?"+r.URL.RawQuery, http.StatusFound)
}

func (h *Handler) ssoLoginPage(w http.ResponseWriter, r *http.Request) {
	p := readSSOAuthParams(r)
	if _, err := h.validateSSOAuthParams(p); err != nil {
		response.Err(w, http.StatusBadRequest, "неверные параметры SSO")
		return
	}
	data := struct {
		ResponseType        string
		ClientID            string
		RedirectURI         string
		State               string
		CodeChallenge       string
		CodeChallengeMethod string
	}{
		ResponseType:        p.ResponseType,
		ClientID:            p.ClientID,
		RedirectURI:         p.RedirectURI,
		State:               p.State,
		CodeChallenge:       p.CodeChallenge,
		CodeChallengeMethod: p.CodeChallengeMethod,
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_ = template.Must(template.New("sso").Parse(ssoLoginHTML)).Execute(w, data)
}

func (h *Handler) ssoLoginSubmit(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		response.Err(w, http.StatusBadRequest, "неверное тело запроса")
		return
	}
	p := ssoAuthParams{
		ResponseType:        r.FormValue("response_type"),
		ClientID:            r.FormValue("client_id"),
		RedirectURI:         r.FormValue("redirect_uri"),
		State:               r.FormValue("state"),
		CodeChallenge:       r.FormValue("code_challenge"),
		CodeChallengeMethod: r.FormValue("code_challenge_method"),
	}
	if _, err := h.validateSSOAuthParams(p); err != nil {
		response.Err(w, http.StatusBadRequest, "неверные параметры SSO")
		return
	}
	user, err := h.authUC.VerifyCredentials(r.FormValue("email"), r.FormValue("password"))
	if err != nil {
		response.Err(w, http.StatusUnauthorized, "неверный логин или пароль")
		return
	}
	sessionID := randomToken(32)
	h.mu.Lock()
	h.sessions[sessionID] = sessionEntry{UserID: user.ID, ExpiresAt: time.Now().Add(12 * time.Hour)}
	h.mu.Unlock()
	http.SetCookie(w, &http.Cookie{
		Name:     "sso_session",
		Value:    sessionID,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   h.shouldSetSecureCookie(r),
		Expires:  time.Now().Add(12 * time.Hour),
	})
	h.redirectWithCode(w, r, user.ID, p)
}

func (h *Handler) ssoToken(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		response.Err(w, http.StatusBadRequest, "неверное тело запроса")
		return
	}
	if r.FormValue("grant_type") != "authorization_code" {
		response.Err(w, http.StatusBadRequest, "поддерживается только authorization_code")
		return
	}
	code := r.FormValue("code")
	clientID := r.FormValue("client_id")
	redirectURI := r.FormValue("redirect_uri")
	codeVerifier := r.FormValue("code_verifier")
	if code == "" || clientID == "" || redirectURI == "" || codeVerifier == "" {
		response.Err(w, http.StatusBadRequest, "не хватает параметров для обмена кода")
		return
	}
	clientCfg, ok := h.ssoClients[clientID]
	if !ok {
		response.Err(w, http.StatusUnauthorized, "неизвестный client_id")
		return
	}
	if _, ok := clientCfg.RedirectURIs[redirectURI]; !ok {
		response.Err(w, http.StatusUnauthorized, "redirect_uri не разрешён для клиента")
		return
	}
	h.mu.Lock()
	entry, ok := h.codes[code]
	if ok {
		delete(h.codes, code)
	}
	h.mu.Unlock()
	if !ok || time.Now().After(entry.ExpiresAt) {
		response.Err(w, http.StatusUnauthorized, "код авторизации недействителен или истёк")
		return
	}
	if entry.ClientID != clientID || entry.RedirectURI != redirectURI {
		response.Err(w, http.StatusUnauthorized, "параметры клиента не совпадают")
		return
	}
	sum := sha256.Sum256([]byte(codeVerifier))
	encoded := base64.RawURLEncoding.EncodeToString(sum[:])
	if encoded != entry.CodeChallenge {
		response.Err(w, http.StatusUnauthorized, "code_verifier не прошёл проверку")
		return
	}
	user, err := h.authUC.GetByID(entry.UserID)
	if err != nil {
		response.Err(w, http.StatusUnauthorized, "пользователь не найден")
		return
	}
	access, refresh, err := h.authUC.IssueTokensForRole(user, clientCfg.Role)
	if err != nil {
		response.Err(w, http.StatusInternalServerError, "не удалось выпустить токены")
		return
	}
	response.JSON(w, http.StatusOK, map[string]any{
		"token_type":    "Bearer",
		"access_token":  access,
		"token":         access,
		"refresh_token": refresh,
		"expires_in":    60 * 15,
		"user_id":       user.ID.String(),
		"type":          string(clientCfg.Role),
	})
}

func (h *Handler) sessionUserID(r *http.Request) (uuid.UUID, bool) {
	c, err := r.Cookie("sso_session")
	if err != nil || c.Value == "" {
		return uuid.Nil, false
	}
	h.mu.Lock()
	defer h.mu.Unlock()
	entry, ok := h.sessions[c.Value]
	if !ok || time.Now().After(entry.ExpiresAt) {
		delete(h.sessions, c.Value)
		return uuid.Nil, false
	}
	return entry.UserID, true
}

func (h *Handler) redirectWithCode(w http.ResponseWriter, r *http.Request, userID uuid.UUID, p ssoAuthParams) {
	code := randomToken(32)
	h.mu.Lock()
	h.codes[code] = authCode{
		UserID:              userID,
		ClientID:            p.ClientID,
		RedirectURI:         p.RedirectURI,
		CodeChallenge:       p.CodeChallenge,
		CodeChallengeMethod: strings.ToUpper(p.CodeChallengeMethod),
		ExpiresAt:           time.Now().Add(5 * time.Minute),
	}
	h.mu.Unlock()
	u, err := url.Parse(p.RedirectURI)
	if err != nil {
		response.Err(w, http.StatusBadRequest, "неверный redirect_uri")
		return
	}
	q := u.Query()
	q.Set("code", code)
	if p.State != "" {
		q.Set("state", p.State)
	}
	u.RawQuery = q.Encode()
	http.Redirect(w, r, u.String(), http.StatusFound)
}

func randomToken(size int) string {
	b := make([]byte, size)
	_, _ = rand.Read(b)
	return base64.RawURLEncoding.EncodeToString(b)
}

const ssoLoginHTML = `<!doctype html>
<html lang="ru">
<head><meta charset="utf-8"><title>SSO Login</title></head>
<body>
  <h2>Вход в SSO</h2>
  <form method="post" action="/sso/login">
    <label>Email: <input type="email" name="email" required></label><br><br>
    <label>Пароль: <input type="password" name="password" required></label><br><br>
    <input type="hidden" name="response_type" value="{{.ResponseType}}">
    <input type="hidden" name="client_id" value="{{.ClientID}}">
    <input type="hidden" name="redirect_uri" value="{{.RedirectURI}}">
    <input type="hidden" name="state" value="{{.State}}">
    <input type="hidden" name="code_challenge" value="{{.CodeChallenge}}">
    <input type="hidden" name="code_challenge_method" value="{{.CodeChallengeMethod}}">
    <button type="submit">Войти</button>
  </form>
</body>
</html>`
