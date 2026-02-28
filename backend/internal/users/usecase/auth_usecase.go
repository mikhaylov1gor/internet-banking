package usecase

import (
	"errors"

	"internet-bank/internal/users/entity"
	"internet-bank/pkg/auth"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials  = errors.New("invalid email or password")
	ErrUserBlocked         = errors.New("user is blocked")
	ErrInvalidRefreshToken = errors.New("invalid or expired refresh token")
)

type AuthConfig struct {
	JWTSecret  string
	AccessTTL  int
	RefreshTTL int
}

type AuthUseCase struct {
	userRepo interface {
		GetByEmail(email string) (*entity.User, error)
		GetByID(id uuid.UUID) (*entity.User, error)
	}
	cfg AuthConfig
}

func NewAuthUseCase(userRepo interface {
	GetByEmail(string) (*entity.User, error)
	GetByID(uuid.UUID) (*entity.User, error)
}, cfg AuthConfig) *AuthUseCase {
	return &AuthUseCase{userRepo: userRepo, cfg: cfg}
}

func (uc *AuthUseCase) Login(email, password string) (accessToken, refreshToken string, user *entity.User, err error) {
	user, err = uc.userRepo.GetByEmail(email)
	if err != nil {
		return "", "", nil, ErrInvalidCredentials
	}
	if user.Status == entity.UserStatusBlocked {
		return "", "", nil, ErrUserBlocked
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return "", "", nil, ErrInvalidCredentials
	}
	userType := auth.UserType(user.Type)
	accessToken, err = auth.NewAccessToken(user.ID, userType, uc.cfg.JWTSecret, uc.cfg.AccessTTL)
	if err != nil {
		return "", "", nil, err
	}
	refreshToken, err = auth.NewRefreshToken(user.ID, userType, uc.cfg.JWTSecret, uc.cfg.RefreshTTL)
	if err != nil {
		return "", "", nil, err
	}
	return accessToken, refreshToken, user, nil
}

func (uc *AuthUseCase) Refresh(refreshToken string) (accessToken, newRefreshToken string, user *entity.User, err error) {
	claims, err := auth.ParseRefreshToken(refreshToken, uc.cfg.JWTSecret)
	if err != nil {
		return "", "", nil, ErrInvalidRefreshToken
	}
	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		return "", "", nil, ErrInvalidRefreshToken
	}
	user, err = uc.userRepo.GetByID(userID)
	if err != nil {
		return "", "", nil, ErrInvalidRefreshToken
	}
	if user.Status == entity.UserStatusBlocked {
		return "", "", nil, ErrUserBlocked
	}
	userType := auth.UserType(user.Type)
	accessToken, err = auth.NewAccessToken(user.ID, userType, uc.cfg.JWTSecret, uc.cfg.AccessTTL)
	if err != nil {
		return "", "", nil, err
	}
	newRefreshToken, err = auth.NewRefreshToken(user.ID, userType, uc.cfg.JWTSecret, uc.cfg.RefreshTTL)
	if err != nil {
		return "", "", nil, err
	}
	return accessToken, newRefreshToken, user, nil
}
