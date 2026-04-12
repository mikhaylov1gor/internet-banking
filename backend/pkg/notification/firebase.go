package notification

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/messaging"
	"google.golang.org/api/option"
)

// Max tokens per FCM multicast request (Firebase limit).
const fcmMulticastLimit = 500

type FirebaseNotifier interface {
	SendToUser(ctx context.Context, userID string, title, body string) error
	SendMulticast(ctx context.Context, tokens []string, title, body string) error
}

// NewFirebaseNotifier returns a real FCM sender if credentialsPath points to a service account JSON file.
// If credentialsPath is empty, returns a mock that only logs (safe for local dev).
func NewFirebaseNotifier(ctx context.Context, credentialsPath string) (FirebaseNotifier, error) {
	if credentialsPath == "" {
		log.Printf("FirebaseNotifier: mock mode (set FIREBASE_CREDENTIALS_PATH to service account JSON for real FCM)")
		return &mockFirebaseNotifier{}, nil
	}
	if _, err := os.Stat(credentialsPath); err != nil {
		return nil, fmt.Errorf("firebase credentials file %q: %w", credentialsPath, err)
	}
	app, err := firebase.NewApp(ctx, nil, option.WithCredentialsFile(credentialsPath))
	if err != nil {
		return nil, fmt.Errorf("firebase.NewApp: %w", err)
	}
	client, err := app.Messaging(ctx)
	if err != nil {
		return nil, fmt.Errorf("firebase Messaging: %w", err)
	}
	log.Printf("FirebaseNotifier: FCM enabled (credentials: %s)", credentialsPath)
	return &fcmFirebaseNotifier{client: client}, nil
}

type mockFirebaseNotifier struct{}

func (fn *mockFirebaseNotifier) SendToUser(ctx context.Context, userID string, title, body string) error {
	log.Printf("[FCM mock] to user %s: %s — %s", userID, title, body)
	return nil
}

func (fn *mockFirebaseNotifier) SendMulticast(ctx context.Context, tokens []string, title, body string) error {
	log.Printf("[FCM mock] multicast %d tokens: %s — %s", len(tokens), title, body)
	return nil
}

type fcmFirebaseNotifier struct {
	client *messaging.Client
}

func (fn *fcmFirebaseNotifier) SendToUser(ctx context.Context, userID string, title, body string) error {
	log.Printf("FCM SendToUser skipped for user %s (no device tokens in this path; use consumer with token client)", userID)
	return nil
}

func (fn *fcmFirebaseNotifier) SendMulticast(ctx context.Context, tokens []string, title, body string) error {
	if len(tokens) == 0 {
		return nil
	}
	for i := 0; i < len(tokens); i += fcmMulticastLimit {
		end := i + fcmMulticastLimit
		if end > len(tokens) {
			end = len(tokens)
		}
		batch := tokens[i:end]
		msg := &messaging.MulticastMessage{
			Tokens: batch,
			Notification: &messaging.Notification{
				Title: title,
				Body:  body,
			},
		}
		br, err := fn.client.SendEachForMulticast(ctx, msg)
		if err != nil {
			return fmt.Errorf("fcm SendEachForMulticast: %w", err)
		}
		if br.FailureCount > 0 {
			for j, resp := range br.Responses {
				if resp.Error != nil {
					log.Printf("fcm batch[%d:%d]: %v", i, j, resp.Error)
				}
			}
		}
	}
	return nil
}

type NotificationPayload struct {
	UserID          string `json:"user_id"`
	Title           string `json:"title"`
	Body            string `json:"body"`
	NotifyEmployees bool   `json:"notify_employees"`
}

func UnmarshalNotificationPayload(data []byte) (*NotificationPayload, error) {
	var payload NotificationPayload
	err := json.Unmarshal(data, &payload)
	return &payload, err
}
