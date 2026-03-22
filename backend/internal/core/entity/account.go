package entity

import (
	"time"

	"github.com/google/uuid"
)

type AccountStatus string

const (
	AccountStatusActive AccountStatus = "active"
	AccountStatusClosed AccountStatus = "closed"
)

type Currency string

const (
	CurrencyRUB Currency = "RUB"
	CurrencyUSD Currency = "USD"
	CurrencyEUR Currency = "EUR"
)

type Account struct {
	ID            uuid.UUID     `gorm:"type:uuid;primaryKey"`
	AccountNumber string        `gorm:"type:varchar(20);uniqueIndex"`
	ClientID      uuid.UUID     `gorm:"type:uuid;not null;index"`
	Balance       float64       `gorm:"not null;default:0"`
	Currency      Currency      `gorm:"type:varchar(3);default:RUB"`
	Status        AccountStatus `gorm:"type:varchar(20);not null"`
	OpenedAt      time.Time     `gorm:"not null"`
	ClosedAt      *time.Time    `gorm:""`
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

func (Account) TableName() string { return "accounts" }
