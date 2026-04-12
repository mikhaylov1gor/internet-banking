package notification

import (
	"context"
	"encoding/json"
	"log"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/google/uuid"

	"internet-bank/pkg/notification"
)

type NotificationConsumer struct {
	conn        *amqp.Connection
	channel     *amqp.Channel
	notifier    notification.FirebaseNotifier
	tokens      *UsersPushTokenClient
	queueName   string
	consumerTag string
}

func NewNotificationConsumer(conn *amqp.Connection, notifier notification.FirebaseNotifier, tokens *UsersPushTokenClient, queueName string) (*NotificationConsumer, error) {
	ch, err := conn.Channel()
	if err != nil {
		return nil, err
	}
	_, err = ch.QueueDeclare(queueName, true, false, false, false, nil)
	if err != nil {
		_ = ch.Close()
		return nil, err
	}
	return &NotificationConsumer{
		conn:      conn,
		channel:   ch,
		notifier:  notifier,
		tokens:    tokens,
		queueName: queueName,
	}, nil
}

func (nc *NotificationConsumer) Start(ctx context.Context) error {
	msgs, err := nc.channel.Consume(nc.queueName, nc.consumerTag, false, false, false, false, nil)
	if err != nil {
		return err
	}

	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			case msg, ok := <-msgs:
				if !ok {
					return
				}
				if msg.Body == nil {
					_ = msg.Ack(false)
					continue
				}
				var payload notification.NotificationPayload
				if err := json.Unmarshal(msg.Body, &payload); err != nil {
					log.Printf("notification: bad json: %v", err)
					_ = msg.Nack(false, false)
					continue
				}
				if err := nc.dispatch(ctx, &payload); err != nil {
					log.Printf("notification: dispatch: %v", err)
					_ = msg.Nack(false, true)
					continue
				}
				_ = msg.Ack(false)
			case <-time.After(30 * time.Second):
			}
		}
	}()

	return nil
}

func (nc *NotificationConsumer) dispatch(ctx context.Context, payload *notification.NotificationPayload) error {
	if payload.UserID != "" {
		uid, err := uuid.Parse(payload.UserID)
		if err != nil {
			log.Printf("notification: bad user_id %q", payload.UserID)
		} else if nc.tokens != nil {
			toks, err := nc.tokens.ClientTokens(ctx, uid)
			if err != nil {
				log.Printf("notification: client tokens: %v", err)
			} else if len(toks) > 0 {
				if err := nc.notifier.SendMulticast(ctx, toks, payload.Title, payload.Body); err != nil {
					return err
				}
			}
		} else {
			_ = nc.notifier.SendToUser(ctx, payload.UserID, payload.Title, payload.Body)
		}
	}
	if payload.NotifyEmployees && nc.tokens != nil {
		toks, err := nc.tokens.EmployeeTokens(ctx)
		if err != nil {
			log.Printf("notification: employee tokens: %v", err)
			return nil
		}
		if len(toks) > 0 {
			return nc.notifier.SendMulticast(ctx, toks, payload.Title, payload.Body)
		}
	}
	return nil
}

func (nc *NotificationConsumer) Close() error {
	if nc.channel != nil {
		return nc.channel.Close()
	}
	return nil
}
