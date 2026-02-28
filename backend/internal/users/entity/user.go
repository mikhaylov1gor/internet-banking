package entity

import (
	"time"

	"github.com/google/uuid"
)

type UserType string

const (
	UserTypeClient   UserType = "client"
	UserTypeEmployee UserType = "employee"
)

type UserStatus string

const (
	UserStatusActive  UserStatus = "active"
	UserStatusBlocked UserStatus = "blocked"
)

type User struct {
	ID           uuid.UUID  `gorm:"type:uuid;primaryKey"`
	Type         UserType   `gorm:"type:varchar(20);not null"`
	Email        string     `gorm:"type:varchar(255);uniqueIndex;not null"`
	PasswordHash string     `gorm:"column:password_hash;not null"`
	FullName     string     `gorm:"column:full_name;type:varchar(255)"`
	Phone        string     `gorm:"type:varchar(50)"`
	Status       UserStatus `gorm:"type:varchar(20);not null;default:active"`
	CreatedAt    time.Time  `gorm:"not null"`
	UpdatedAt    time.Time  `gorm:"not null"`
}

func (User) TableName() string { return "users" }
