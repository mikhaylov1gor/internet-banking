package entity

import (
	"time"

	"github.com/google/uuid"
)

type RequestLog struct {
	ID         uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	Timestamp  time.Time  `gorm:"index" json:"timestamp"`
	TraceID    string     `gorm:"type:varchar(36);index" json:"trace_id"`
	Service    string     `gorm:"type:varchar(50);index" json:"service"`
	Endpoint   string     `gorm:"type:varchar(255)" json:"endpoint"`
	Method     string     `gorm:"type:varchar(10)" json:"method"`
	StatusCode int        `gorm:"index" json:"status_code"`
	DurationMs int64      `gorm:"index" json:"duration_ms"`
	UserID     *uuid.UUID `gorm:"type:uuid" json:"user_id,omitempty"`
	ErrorMsg   *string    `gorm:"type:text" json:"error_msg,omitempty"`
	CreatedAt  time.Time  `gorm:"autoCreateTime" json:"created_at,omitempty"`
}

func (RequestLog) TableName() string {
	return "request_logs"
}
