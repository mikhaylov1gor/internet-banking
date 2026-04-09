package notification

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/streadway/amqp"

	"internet-bank/pkg/notification"
)

type NotificationConsumer struct {
	conn      *amqp.Connection
	channel   *amqp.Channel
	notifier  notification.FirebaseNotifier
	queueName string
}

func NewNotificationConsumer(conn *amqp.Connection, notifier notification.FirebaseNotifier, queueName string) (*NotificationConsumer, error) {
	ch, err := conn.Channel()
	if err != nil {
		return nil, err
	}

	return &NotificationConsumer{
		conn:      conn,
		channel:   ch,
		notifier:  notifier,
		queueName: queueName,
	}, nil
}

func (nc *NotificationConsumer) Start(ctx context.Context) error {
	msgs, err := nc.channel.Consume(nc.queueName, "", false, false, false, false, nil)
	if err != nil {
		return err
	}

	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			case msg := <-msgs:
				if msg.Body != nil {
					var payload notification.NotificationPayload
					if err := json.Unmarshal(msg.Body, &payload); err != nil {
						log.Printf("Failed to unmarshal notification: %v", err)
						msg.Nack(false, true)
						continue
					}

					if err := nc.notifier.SendToUser(ctx, payload.UserID, payload.Title, payload.Body); err != nil {
						log.Printf("Failed to send notification: %v", err)
						msg.Nack(false, true)
						continue
					}

					msg.Ack(false)
				}
			case <-time.After(30 * time.Second):
				// Keep connection alive
			}
		}
	}()

	return nil
}

func (nc *NotificationConsumer) Close() error {
	if nc.channel != nil {
		nc.channel.Close()
	}
	return nil
}
