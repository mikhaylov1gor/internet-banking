package entity

import (
	"time"

	"github.com/google/uuid"
)

type AppType string

const (
	AppTypeClient   AppType = "client"
	AppTypeEmployee AppType = "employee"
)

type Theme string

const (
	ThemeLight Theme = "light"
	ThemeDark  Theme = "dark"
)

type AppSettings struct {
	ID               uuid.UUID `gorm:"type:uuid;primaryKey"`
	UserID           uuid.UUID `gorm:"type:uuid;not null;index:idx_user_app,priority:1"`
	AppType          AppType   `gorm:"type:varchar(20);not null;index:idx_user_app,priority:2"`
	Theme            Theme     `gorm:"type:varchar(10);not null;default:light"`
	HiddenAccountIDs string    `gorm:"type:text;not null;default:'[]'"`
	CreatedAt        time.Time `gorm:"not null"`
	UpdatedAt        time.Time `gorm:"not null"`
}

func (AppSettings) TableName() string { return "app_settings" }
