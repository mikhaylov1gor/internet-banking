package entity

import "time"

type MetricsSummary struct {
	TotalRequests int64   `json:"total_requests"`
	AvgDuration   float64 `json:"avg_duration_ms"`
	ErrorRate     float64 `json:"error_rate"`
	P95Duration   float64 `json:"p95_duration_ms"`
	P99Duration   float64 `json:"p99_duration_ms"`
}

type ErrorEntry struct {
	TraceID    string    `json:"trace_id"`
	Service    string    `json:"service"`
	Endpoint   string    `json:"endpoint"`
	StatusCode int       `json:"status_code"`
	ErrorMsg   string    `json:"error_msg"`
	Timestamp  time.Time `json:"timestamp"`
}

type TimeSeriesPoint struct {
	Timestamp time.Time `json:"timestamp"`
	Value     float64   `json:"value"`
}

type DashboardData struct {
	RequestCounts  []TimeSeriesPoint `json:"request_counts"`
	ErrorRates     []TimeSeriesPoint `json:"error_rates"`
	AvgDurations   []TimeSeriesPoint `json:"avg_durations"`
	RecentRequests []*RequestLog     `json:"recent_requests"`
}
