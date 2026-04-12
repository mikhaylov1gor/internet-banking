package entity

import (
	"time"

	"github.com/google/uuid"
)

// DevicePushToken stores an FCM (or Web Push) token for push notifications.
type DevicePushToken struct {
	ID       uuid.UUID `gorm:"type:uuid;primaryKey"`
	UserID   uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:ux_user_token,priority:1"`
	Token    string    `gorm:"type:text;not null;uniqueIndex:ux_user_token,priority:2"`
	Role     string    `gorm:"type:varchar(20);not null"` // client | employee (from JWT at registration)
	Platform string    `gorm:"type:varchar(32)"`
	UpdatedAt time.Time
	CreatedAt time.Time
}

func (DevicePushToken) TableName() string {
	return "device_push_tokens"
}
