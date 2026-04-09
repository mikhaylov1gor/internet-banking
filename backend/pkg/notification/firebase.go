package notification

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
)

type FirebaseNotifier interface {
	SendToUser(ctx context.Context, userID string, title, body string) error
	SendMulticast(ctx context.Context, tokens []string, title, body string) error
}

type firebaseNotifier struct {
	// In production, this would be:
	// client *messaging.Client
	initialized bool
}

func NewFirebaseNotifier(ctx context.Context, credentialsPath string) (FirebaseNotifier, error) {
	// TODO: Initialize Firebase with credentialsPath
	// For now, return a mock notifier for testing
	log.Printf("FirebaseNotifier initialized (mock mode, credentials: %s)", credentialsPath)
	return &firebaseNotifier{initialized: true}, nil
}

func (fn *firebaseNotifier) SendToUser(ctx context.Context, userID string, title, body string) error {
	if !fn.initialized {
		return fmt.Errorf("notifier not initialized")
	}
	log.Printf("Sending notification to user %s: %s - %s", userID, title, body)
	return nil
}

func (fn *firebaseNotifier) SendMulticast(ctx context.Context, tokens []string, title, body string) error {
	if !fn.initialized {
		return fmt.Errorf("notifier not initialized")
	}
	log.Printf("Sending multicast notification to %d tokens: %s - %s", len(tokens), title, body)
	return nil
}

type NotificationPayload struct {
	UserID string `json:"user_id"`
	Title  string `json:"title"`
	Body   string `json:"body"`
}

func UnmarshalNotificationPayload(data []byte) (*NotificationPayload, error) {
	var payload NotificationPayload
	err := json.Unmarshal(data, &payload)
	return &payload, err
}
