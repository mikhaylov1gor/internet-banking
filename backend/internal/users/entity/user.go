package entity

import (
	"encoding/json"
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
	Roles        string     `gorm:"type:text;not null;default:'[]'"`
	Email        string     `gorm:"type:varchar(255);uniqueIndex;not null"`
	PasswordHash string     `gorm:"column:password_hash;not null"`
	FullName     string     `gorm:"column:full_name;type:varchar(255)"`
	Phone        string     `gorm:"type:varchar(50)"`
	Status       UserStatus `gorm:"type:varchar(20);not null;default:active"`
	CreatedAt    time.Time  `gorm:"not null"`
	UpdatedAt    time.Time  `gorm:"not null"`
}

func (User) TableName() string { return "users" }

func (u *User) GetRoles() []UserType {
	if u.Roles == "" {
		if u.Type != "" {
			return []UserType{u.Type}
		}
		return []UserType{}
	}
	var roles []UserType
	if err := json.Unmarshal([]byte(u.Roles), &roles); err != nil || len(roles) == 0 {
		if u.Type != "" {
			return []UserType{u.Type}
		}
		return []UserType{}
	}
	return roles
}

func (u *User) SetRoles(roles []UserType) error {
	b, err := json.Marshal(roles)
	if err != nil {
		return err
	}
	u.Roles = string(b)
	if len(roles) > 0 {
		u.Type = roles[0]
	}
	return nil
}

func (u *User) HasRole(role UserType) bool {
	for _, r := range u.GetRoles() {
		if r == role {
			return true
		}
	}
	return false
}
