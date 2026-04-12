package repository

import (
	"time"

	"gorm.io/gorm"

	"internet-bank/internal/monitoring/entity"
)

type LogsRepository interface {
	Create(log *entity.RequestLog) error
	CreateBatch(logs []*entity.RequestLog) error
	GetByTraceID(traceID string) ([]*entity.RequestLog, error)
	GetByService(service string, from, to time.Time, limit, offset int) ([]*entity.RequestLog, int64, error)
	GetErrors(service string, limit int) ([]*entity.ErrorEntry, error)
	GetMetricsSummary(service string, from, to time.Time) (*entity.MetricsSummary, error)
}

type metricsAggRow struct {
	TotalRequests int64   `gorm:"column:total_requests"`
	AvgDuration   float64 `gorm:"column:avg_duration"`
	ErrorRate     float64 `gorm:"column:error_rate"`
	P95Duration   float64 `gorm:"column:p95_duration"`
	P99Duration   float64 `gorm:"column:p99_duration"`
}

type logsRepository struct {
	db *gorm.DB
}

func NewLogsRepository(db *gorm.DB) LogsRepository {
	return &logsRepository{db: db}
}

func (r *logsRepository) Create(log *entity.RequestLog) error {
	return r.db.Create(log).Error
}

func (r *logsRepository) CreateBatch(logs []*entity.RequestLog) error {
	if len(logs) == 0 {
		return nil
	}
	return r.db.CreateInBatches(logs, 100).Error
}

func (r *logsRepository) GetByTraceID(traceID string) ([]*entity.RequestLog, error) {
	var logs []*entity.RequestLog
	err := r.db.Where("trace_id = ?", traceID).Order("timestamp DESC").Find(&logs).Error
	return logs, err
}

func (r *logsRepository) GetByService(service string, from, to time.Time, limit, offset int) ([]*entity.RequestLog, int64, error) {
	var logs []*entity.RequestLog
	var total int64
	countQ := r.db.Model(&entity.RequestLog{}).Where("timestamp BETWEEN ? AND ?", from, to)
	listQ := r.db.Model(&entity.RequestLog{}).Where("timestamp BETWEEN ? AND ?", from, to)
	if service != "" {
		countQ = countQ.Where("service = ?", service)
		listQ = listQ.Where("service = ?", service)
	}
	if err := countQ.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := listQ.Order("timestamp DESC").Limit(limit).Offset(offset).Find(&logs).Error
	return logs, total, err
}

func (r *logsRepository) GetErrors(service string, limit int) ([]*entity.ErrorEntry, error) {
	var entries []*entity.ErrorEntry
	q := r.db.
		Table("request_logs").
		Select("trace_id, service, endpoint, status_code, error_msg, timestamp").
		Where("status_code >= ?", 400)
	if service != "" {
		q = q.Where("service = ?", service)
	}
	err := q.Order("timestamp DESC").Limit(limit).Scan(&entries).Error
	return entries, err
}

func (r *logsRepository) GetMetricsSummary(service string, from, to time.Time) (*entity.MetricsSummary, error) {
	sql := `SELECT
		COUNT(*)::bigint AS total_requests,
		COALESCE(AVG(duration_ms), 0) AS avg_duration,
		CASE WHEN COUNT(*) = 0 THEN 0::double precision
			ELSE (SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END)::double precision * 100.0 / NULLIF(COUNT(*), 0)::double precision)
		END AS error_rate,
		COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms), 0) AS p95_duration,
		COALESCE(percentile_cont(0.99) WITHIN GROUP (ORDER BY duration_ms), 0) AS p99_duration
	FROM request_logs
	WHERE timestamp BETWEEN ? AND ?`
	args := []interface{}{from, to}
	if service != "" {
		sql += ` AND service = ?`
		args = append(args, service)
	}
	var row metricsAggRow
	if err := r.db.Raw(sql, args...).Scan(&row).Error; err != nil {
		return nil, err
	}
	return &entity.MetricsSummary{
		TotalRequests: row.TotalRequests,
		AvgDuration:   row.AvgDuration,
		ErrorRate:     row.ErrorRate,
		P95Duration:   row.P95Duration,
		P99Duration:   row.P99Duration,
	}, nil
}
