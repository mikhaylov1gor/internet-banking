package usecase

import (
	"errors"

	"internet-bank/internal/users/entity"
	"internet-bank/pkg/auth"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials  = errors.New("неверный email или пароль")
	ErrUserBlocked         = errors.New("пользователь заблокирован")
	ErrInvalidRefreshToken = errors.New("недействительный или истёкший refresh-токен")
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

func (uc *AuthUseCase) Login(email, password string, roleHint string) (accessToken, refreshToken string, user *entity.User, issuedType auth.UserType, err error) {
	user, err = uc.VerifyCredentials(email, password)
	if err != nil {
		return "", "", nil, "", err
	}
	issuedType, err = resolveRole(user, roleHint)
	if err != nil {
		return "", "", nil, "", err
	}
	accessToken, refreshToken, err = uc.IssueTokensForRole(user, issuedType)
	if err != nil {
		return "", "", nil, "", err
	}
	return accessToken, refreshToken, user, issuedType, nil
}

func (uc *AuthUseCase) Refresh(refreshToken string) (accessToken, newRefreshToken string, user *entity.User, issuedType auth.UserType, err error) {
	claims, err := auth.ParseRefreshToken(refreshToken, uc.cfg.JWTSecret)
	if err != nil {
		return "", "", nil, "", ErrInvalidRefreshToken
	}
	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		return "", "", nil, "", ErrInvalidRefreshToken
	}
	user, err = uc.userRepo.GetByID(userID)
	if err != nil {
		return "", "", nil, "", ErrInvalidRefreshToken
	}
	if user.Status == entity.UserStatusBlocked {
		return "", "", nil, "", ErrUserBlocked
	}
	issuedType = claims.UserType
	if !user.HasRole(entity.UserType(issuedType)) {
		return "", "", nil, "", ErrInvalidRefreshToken
	}
	accessToken, newRefreshToken, err = uc.IssueTokensForRole(user, issuedType)
	if err != nil {
		return "", "", nil, "", err
	}
	return accessToken, newRefreshToken, user, issuedType, nil
}

func (uc *AuthUseCase) VerifyCredentials(email, password string) (*entity.User, error) {
	user, err := uc.userRepo.GetByEmail(email)
	if err != nil {
		return nil, ErrInvalidCredentials
	}
	if user.Status == entity.UserStatusBlocked {
		return nil, ErrUserBlocked
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, ErrInvalidCredentials
	}
	return user, nil
}

func (uc *AuthUseCase) GetByID(id uuid.UUID) (*entity.User, error) {
	return uc.userRepo.GetByID(id)
}

func (uc *AuthUseCase) IssueTokensForRole(user *entity.User, userType auth.UserType) (accessToken, refreshToken string, err error) {
	if !user.HasRole(entity.UserType(userType)) {
		return "", "", ErrInvalidCredentials
	}
	accessToken, err = auth.NewAccessToken(user.ID, userType, uc.cfg.JWTSecret, uc.cfg.AccessTTL)
	if err != nil {
		return "", "", err
	}
	refreshToken, err = auth.NewRefreshToken(user.ID, userType, uc.cfg.JWTSecret, uc.cfg.RefreshTTL)
	if err != nil {
		return "", "", err
	}
	return accessToken, refreshToken, nil
}

func resolveRole(user *entity.User, roleHint string) (auth.UserType, error) {
	if roleHint != "" {
		switch auth.UserType(roleHint) {
		case auth.UserTypeClient, auth.UserTypeEmployee:
			if user.HasRole(entity.UserType(roleHint)) {
				return auth.UserType(roleHint), nil
			}
			return "", ErrInvalidCredentials
		default:
			return "", ErrInvalidCredentials
		}
	}
	if user.HasRole(entity.UserTypeClient) {
		return auth.UserTypeClient, nil
	}
	if user.HasRole(entity.UserTypeEmployee) {
		return auth.UserTypeEmployee, nil
	}
	return "", ErrInvalidCredentials
}
