package usecase

import (
	"context"
	"fmt"

	"internet-bank/internal/core/broker"
	"internet-bank/internal/core/entity"
	"internet-bank/pkg/notification"

	"github.com/google/uuid"
)

// OperationNotifier sends a push notification after an operation is recorded.
type OperationNotifier interface {
	NotifyOperationCreated(ctx context.Context, clientID uuid.UUID, op *entity.Operation) error
}

// NotificationBrokerPublisher publishes operation events to the notification queue.
type NotificationBrokerPublisher struct {
	B *broker.NotificationBroker
}

func (p *NotificationBrokerPublisher) NotifyOperationCreated(ctx context.Context, clientID uuid.UUID, op *entity.Operation) error {
	if p == nil || p.B == nil {
		return nil
	}
	title := "Новая операция"
	body := fmt.Sprintf("%s %.2f по счёту", op.Type, op.Amount)
	return p.B.Publish(&notification.NotificationPayload{
		UserID:          clientID.String(),
		Title:           title,
		Body:            body,
		NotifyEmployees: true,
	})
}
