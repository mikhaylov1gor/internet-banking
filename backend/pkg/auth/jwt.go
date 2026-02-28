package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type UserType string

const (
	UserTypeClient   UserType = "client"
	UserTypeEmployee UserType = "employee"
)

type Claims struct {
	jwt.RegisteredClaims
	UserID   string   `json:"user_id"`
	UserType UserType `json:"user_type"`
}

func ParseAccessToken(tokenString, secret string) (*Claims, error) {
	tok, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := tok.Claims.(*Claims)
	if !ok || !tok.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}

type RefreshClaims struct {
	jwt.RegisteredClaims
	UserID   string   `json:"user_id"`
	UserType UserType `json:"user_type"`
}

func ParseRefreshToken(tokenString, secret string) (*RefreshClaims, error) {
	tok, err := jwt.ParseWithClaims(tokenString, &RefreshClaims{}, func(t *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := tok.Claims.(*RefreshClaims)
	if !ok || !tok.Valid {
		return nil, errors.New("invalid refresh token")
	}
	return claims, nil
}

func NewAccessToken(userID uuid.UUID, userType UserType, secret string, ttlMinutes int) (string, error) {
	claims := &Claims{
		UserID:   userID.String(),
		UserType: userType,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(ttlMinutes) * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString([]byte(secret))
}

func NewRefreshToken(userID uuid.UUID, userType UserType, secret string, ttlMinutes int) (string, error) {
	claims := &RefreshClaims{
		UserID:   userID.String(),
		UserType: userType,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(ttlMinutes) * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString([]byte(secret))
}
