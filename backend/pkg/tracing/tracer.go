package tracing

import (
	"github.com/google/uuid"
)

func GenerateTraceID() string {
	return uuid.New().String()
}

type LogEntry struct {
	Timestamp  string  `json:"timestamp"`
	TraceID    string  `json:"trace_id"`
	Service    string  `json:"service"`
	Endpoint   string  `json:"endpoint"`
	Method     string  `json:"method"`
	StatusCode int     `json:"status_code"`
	DurationMs int64   `json:"duration_ms"`
	UserID     *string `json:"user_id"`
	ErrorMsg   *string `json:"error_msg"`
}
