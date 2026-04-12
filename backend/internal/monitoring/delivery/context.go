package delivery

import (
	"internet-bank/internal/monitoring/repository"
	"internet-bank/internal/monitoring/usecase"
)

type HandlerContext struct {
	metricsUC usecase.MetricsUseCase
	logsRepo  repository.LogsRepository
}

func NewHandlerContext(metricsUC usecase.MetricsUseCase, logsRepo repository.LogsRepository) *HandlerContext {
	return &HandlerContext{
		metricsUC: metricsUC,
		logsRepo:  logsRepo,
	}
}
