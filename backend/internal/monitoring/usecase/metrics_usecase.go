package usecase

import (
	"sort"
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
	logs, _, err := uc.repo.GetByService(service, from, to, 2000, 0)
	if err != nil {
		return nil, err
	}

	type bucketAgg struct {
		count  int
		errors int
		sumDur int64
	}
	buckets := make(map[int64]bucketAgg)
	for _, log := range logs {
		h := log.Timestamp.UTC().Truncate(time.Hour).Unix()
		b := buckets[h]
		b.count++
		if log.StatusCode >= 400 {
			b.errors++
		}
		b.sumDur += log.DurationMs
		buckets[h] = b
	}
	keys := make([]int64, 0, len(buckets))
	for k := range buckets {
		keys = append(keys, k)
	}
	sort.Slice(keys, func(i, j int) bool { return keys[i] < keys[j] })

	requestCounts := make([]entity.TimeSeriesPoint, 0, len(keys))
	errorRates := make([]entity.TimeSeriesPoint, 0, len(keys))
	avgDurations := make([]entity.TimeSeriesPoint, 0, len(keys))
	for _, k := range keys {
		b := buckets[k]
		t := time.Unix(k, 0).UTC()
		requestCounts = append(requestCounts, entity.TimeSeriesPoint{Timestamp: t, Value: float64(b.count)})
		errRate := 0.0
		if b.count > 0 {
			errRate = float64(b.errors) * 100.0 / float64(b.count)
		}
		errorRates = append(errorRates, entity.TimeSeriesPoint{Timestamp: t, Value: errRate})
		avg := 0.0
		if b.count > 0 {
			avg = float64(b.sumDur) / float64(b.count)
		}
		avgDurations = append(avgDurations, entity.TimeSeriesPoint{Timestamp: t, Value: avg})
	}

	return &entity.DashboardData{
		RequestCounts:  requestCounts,
		ErrorRates:     errorRates,
		AvgDurations:   avgDurations,
		RecentRequests: logs,
	}, nil
}
