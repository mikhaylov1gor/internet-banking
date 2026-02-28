package entity

import (
	"time"

	"github.com/google/uuid"
)

type CreditTariff struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey"`
	Name      string    `gorm:"type:varchar(255);not null"`
	Rate      float64   `gorm:"not null"`
	MinAmount float64   `gorm:"column:min_amount"`
	MaxAmount float64   `gorm:"column:max_amount"`
	CreatedAt time.Time `gorm:"not null"`
	UpdatedAt time.Time `gorm:"not null"`
}

func (CreditTariff) TableName() string { return "credit_tariffs" }
