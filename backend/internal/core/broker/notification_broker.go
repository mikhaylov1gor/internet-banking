package broker

import (
	"encoding/json"

	amqp "github.com/rabbitmq/amqp091-go"

	"internet-bank/pkg/notification"
)

type NotificationBroker struct {
	ch    *amqp.Channel
	queue string
}

func NewNotificationBroker(conn *amqp.Connection, queue string) (*NotificationBroker, error) {
	ch, err := conn.Channel()
	if err != nil {
		return nil, err
	}
	_, err = ch.QueueDeclare(queue, true, false, false, false, nil)
	if err != nil {
		_ = ch.Close()
		return nil, err
	}
	return &NotificationBroker{ch: ch, queue: queue}, nil
}

func (b *NotificationBroker) Publish(p *notification.NotificationPayload) error {
	body, err := json.Marshal(p)
	if err != nil {
		return err
	}
	return b.ch.Publish("", b.queue, false, false, amqp.Publishing{
		ContentType:  "application/json",
		DeliveryMode: amqp.Persistent,
		Body:         body,
	})
}

func (b *NotificationBroker) Close() error {
	if b.ch != nil {
		return b.ch.Close()
	}
	return nil
}
