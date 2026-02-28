package delivery

import (
	"context"

	"internet-bank/pkg/auth"

	"github.com/google/uuid"
)

type contextKey string

const userContextKey contextKey = "user"

type userContext struct {
	UserID   uuid.UUID
	UserType auth.UserType
}

func withUser(ctx context.Context, userID uuid.UUID, userType auth.UserType) context.Context {
	return context.WithValue(ctx, userContextKey, &userContext{UserID: userID, UserType: userType})
}

func userFromContext(ctx context.Context) (*uuid.UUID, auth.UserType) {
	v := ctx.Value(userContextKey)
	if v == nil {
		return nil, ""
	}
	u := v.(*userContext)
	return &u.UserID, u.UserType
}
