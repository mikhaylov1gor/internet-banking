package usecase

import (
	"time"

	"internet-bank/internal/monitoring/entity"
	"internet-bank/internal/monitoring/repository"
)

type MetricsUseCase interface {
	GetSummary(service string, from, to time.Time) (*entity.MetricsSummary, error)
	GetErrors(service string, limit int) ([]*entity.ErrorEntry, error)
	GetDashboardData(service string, from, to time.Time) (*entity.DashboardData, error)
}

type metricsUseCase struct {
	repo repository.LogsRepository
}

func NewMetricsUseCase(repo repository.LogsRepository) MetricsUseCase {
	return &metricsUseCase{repo: repo}
}

func (uc *metricsUseCase) GetSummary(service string, from, to time.Time) (*entity.MetricsSummary, error) {
	return uc.repo.GetMetricsSummary(service, from, to)
}

func (uc *metricsUseCase) GetErrors(service string, limit int) ([]*entity.ErrorEntry, error) {
	return uc.repo.GetErrors(service, limit)
}

func (uc *metricsUseCase) GetDashboardData(service string, from, to time.Time) (*entity.DashboardData, error) {
	logs, _, err := uc.repo.GetByService(service, from, to, 100, 0)
	if err != nil {
		return nil, err
	}

	requestCounts := make([]entity.TimeSeriesPoint, 0)
	errorRates := make([]entity.TimeSeriesPoint, 0)
	avgDurations := make([]entity.TimeSeriesPoint, 0)

	return &entity.DashboardData{
		RequestCounts:  requestCounts,
		ErrorRates:     errorRates,
		AvgDurations:   avgDurations,
		RecentRequests: logs,
	}, nil
}
