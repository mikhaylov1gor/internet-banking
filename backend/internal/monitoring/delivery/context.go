package delivery

import "internet-bank/internal/monitoring/usecase"

type HandlerContext struct {
	metricsUC usecase.MetricsUseCase
}

func NewHandlerContext(metricsUC usecase.MetricsUseCase) *HandlerContext {
	return &HandlerContext{
		metricsUC: metricsUC,
	}
}
