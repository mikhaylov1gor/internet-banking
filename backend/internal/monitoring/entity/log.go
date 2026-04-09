package entity

import (
	"time"

	"github.com/google/uuid"
)

type RequestLog struct {
	ID         uuid.UUID  `gorm:"type:uuid;primaryKey"`
	Timestamp  time.Time  `gorm:"index"`
	TraceID    string     `gorm:"type:varchar(36);index"`
	Service    string     `gorm:"type:varchar(50);index"`
	Endpoint   string     `gorm:"type:varchar(255)"`
	Method     string     `gorm:"type:varchar(10)"`
	StatusCode int        `gorm:"index"`
	DurationMs int64      `gorm:"index"`
	UserID     *uuid.UUID `gorm:"type:uuid"`
	ErrorMsg   *string    `gorm:"type:text"`
	CreatedAt  time.Time  `gorm:"autoCreateTime"`
}

func (RequestLog) TableName() string {
	return "request_logs"
}
