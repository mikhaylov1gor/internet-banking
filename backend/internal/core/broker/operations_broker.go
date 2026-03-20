package broker

import (
	"encoding/json"
	"fmt"

	"internet-bank/internal/core/entity"

	amqp "github.com/rabbitmq/amqp091-go"
)

type OperationsBroker struct {
	conn  *amqp.Connection
	ch    *amqp.Channel
	queue string
}

func NewOperationsBroker(url, queue string) (*OperationsBroker, error) {
	conn, err := amqp.Dial(url)
	if err != nil {
		return nil, err
	}
	ch, err := conn.Channel()
	if err != nil {
		_ = conn.Close()
		return nil, err
	}
	_, err = ch.QueueDeclare(
		queue,
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		_ = ch.Close()
		_ = conn.Close()
		return nil, err
	}
	return &OperationsBroker{conn: conn, ch: ch, queue: queue}, nil
}

func (b *OperationsBroker) Publish(op *entity.Operation) error {
	body, err := json.Marshal(op)
	if err != nil {
		return err
	}
	return b.ch.Publish(
		"",
		b.queue,
		false,
		false,
		amqp.Publishing{
			ContentType:  "application/json",
			DeliveryMode: amqp.Persistent,
			Body:         body,
			MessageId:    op.ID.String(),
		},
	)
}

func (b *OperationsBroker) Consume(handler func(op *entity.Operation) error) error {
	msgs, err := b.ch.Consume(
		b.queue,
		"",
		false,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		return err
	}
	go func() {
		for d := range msgs {
			var op entity.Operation
			if err := json.Unmarshal(d.Body, &op); err != nil {
				_ = d.Nack(false, false)
				continue
			}
			if err := handler(&op); err != nil {
				_ = d.Nack(false, true)
				continue
			}
			_ = d.Ack(false)
		}
	}()
	return nil
}

func (b *OperationsBroker) Close() error {
	var err1, err2 error
	if b.ch != nil {
		err1 = b.ch.Close()
	}
	if b.conn != nil {
		err2 = b.conn.Close()
	}
	if err1 != nil {
		return err1
	}
	return err2
}

func DefaultQueueName() string {
	return "core.operations"
}

func DefaultURL() string {
	return "amqp://guest:guest@rabbitmq:5672/"
}

func WrapInitError(err error) error {
	return fmt.Errorf("rabbitmq: %w", err)
}
