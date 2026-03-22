package entity

import (
	"time"

	"github.com/google/uuid"
)

type CreditStatus string

const (
	CreditStatusActive  CreditStatus = "active"
	CreditStatusPaid    CreditStatus = "paid"
	CreditStatusOverdue CreditStatus = "overdue"
)

type Credit struct {
	ID           uuid.UUID    `gorm:"type:uuid;primaryKey"`
	ClientID     uuid.UUID    `gorm:"type:uuid;not null;index"`
	AccountID    uuid.UUID    `gorm:"type:uuid;not null;index"`
	TariffID     uuid.UUID    `gorm:"type:uuid;not null"`
	Amount       float64      `gorm:"not null"`
	Rate         float64      `gorm:"not null"`
	TermDays     int          `gorm:"column:term_days;not null;default:0"`
	TotalDue     float64      `gorm:"column:total_due;not null;default:0"`
	DailyPayment float64      `gorm:"column:daily_payment;not null"`
	Remaining    float64      `gorm:"not null"`
	IssuedAt     time.Time    `gorm:"column:issued_at;not null"`
	Status       CreditStatus `gorm:"type:varchar(20);not null"`
	CreatedAt    time.Time    `gorm:"not null"`
	UpdatedAt    time.Time    `gorm:"not null"`
}

func (Credit) TableName() string { return "credits" }
