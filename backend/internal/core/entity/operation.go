package entity

import (
	"time"

	"github.com/google/uuid"
)

type OperationType string

const (
	OpDeposit     OperationType = "deposit"
	OpWithdraw    OperationType = "withdraw"
	OpCreditIssue OperationType = "credit_issue"
	OpCreditRepay OperationType = "credit_repay"
)

type Operation struct {
	ID           uuid.UUID     `gorm:"type:uuid;primaryKey"`
	AccountID    uuid.UUID     `gorm:"type:uuid;not null;index"`
	Type         OperationType `gorm:"type:varchar(30);not null"`
	Amount       float64       `gorm:"not null"`
	BalanceAfter float64       `gorm:"column:balance_after;not null"`
	Description  string        `gorm:"type:text"`
	CreditID     *uuid.UUID    `gorm:"type:uuid"`
	CreatedAt    time.Time     `gorm:"not null"`
}

func (Operation) TableName() string { return "operations" }
