package delivery

import (
	"context"

	"internet-bank/pkg/auth"

	"github.com/google/uuid"
)

type contextKey string

const (
	userContextKey contextKey = "user"
)

type userContext struct {
	UserID   uuid.UUID
	UserType auth.UserType
	Bearer   string
}

func withUser(ctx context.Context, userID uuid.UUID, userType auth.UserType, bearer string) context.Context {
	return context.WithValue(ctx, userContextKey, &userContext{UserID: userID, UserType: userType, Bearer: bearer})
}

func userFromContext(ctx context.Context) (*uuid.UUID, auth.UserType, string) {
	v := ctx.Value(userContextKey)
	if v == nil {
		return nil, "", ""
	}
	u := v.(*userContext)
	return &u.UserID, u.UserType, u.Bearer
}
