package repository

import (
	"time"

	"gorm.io/gorm"

	"internet-bank/internal/monitoring/entity"
)

type LogsRepository interface {
	Create(log *entity.RequestLog) error
	GetByTraceID(traceID string) ([]*entity.RequestLog, error)
	GetByService(service string, from, to time.Time, limit, offset int) ([]*entity.RequestLog, int64, error)
	GetErrors(service string, limit int) ([]*entity.ErrorEntry, error)
	GetMetricsSummary(service string, from, to time.Time) (*entity.MetricsSummary, error)
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

func (r *logsRepository) GetByTraceID(traceID string) ([]*entity.RequestLog, error) {
	var logs []*entity.RequestLog
	err := r.db.Where("trace_id = ?", traceID).Order("timestamp DESC").Find(&logs).Error
	return logs, err
}

func (r *logsRepository) GetByService(service string, from, to time.Time, limit, offset int) ([]*entity.RequestLog, int64, error) {
	var logs []*entity.RequestLog
	var total int64
	query := r.db.Where("service = ? AND timestamp BETWEEN ? AND ?", service, from, to)
	if err := query.Model(&entity.RequestLog{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := query.Order("timestamp DESC").Limit(limit).Offset(offset).Find(&logs).Error
	return logs, total, err
}

func (r *logsRepository) GetErrors(service string, limit int) ([]*entity.ErrorEntry, error) {
	var entries []*entity.ErrorEntry
	err := r.db.
		Table("request_logs").
		Select("trace_id, service, endpoint, status_code, error_msg, timestamp").
		Where("service = ? AND status_code >= ?", service, 400).
		Order("timestamp DESC").
		Limit(limit).
		Scan(&entries).Error
	return entries, err
}

func (r *logsRepository) GetMetricsSummary(service string, from, to time.Time) (*entity.MetricsSummary, error) {
	var summary entity.MetricsSummary
	err := r.db.
		Table("request_logs").
		Select(
			"COUNT(*) as total_requests",
			"AVG(duration_ms) as avg_duration",
			"SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as error_rate",
			"PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration",
			"PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms) as p99_duration").
		Where("service = ? AND timestamp BETWEEN ? AND ?", service, from, to).
		Scan(&summary).Error
	return &summary, err
}
