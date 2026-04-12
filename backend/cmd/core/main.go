package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	amqp "github.com/rabbitmq/amqp091-go"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	appnotif "internet-bank/internal/core/notification"
	"internet-bank/internal/core/bootstrap"
	"internet-bank/internal/core/broker"
	"internet-bank/internal/core/client"
	"internet-bank/internal/core/delivery"
	"internet-bank/internal/core/entity"
	"internet-bank/internal/core/realtime"
	"internet-bank/internal/core/repository"
	"internet-bank/internal/core/usecase"
	"internet-bank/pkg/config"
	"internet-bank/pkg/idempotency"
	thttp "internet-bank/pkg/middleware"
	"internet-bank/pkg/notification"
	"internet-bank/pkg/tracing"
)

func main() {
	cfg := config.LoadCore()
	gormLog := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             200 * time.Millisecond,
			LogLevel:                  logger.Warn,
			IgnoreRecordNotFoundError: true,
			Colorful:                  false,
		},
	)
	db, err := gorm.Open(postgres.Open(cfg.DSN), &gorm.Config{Logger: gormLog})
	if err != nil {
		log.Fatalf("db: %v", err)
	}
	if err := db.AutoMigrate(&entity.Account{}, &entity.Operation{}); err != nil {
		log.Fatalf("migrate: %v", err)
	}
	if err := bootstrap.EnsureMasterAccount(db, cfg); err != nil {
		log.Fatalf("master account: %v", err)
	}

	lb := tracing.InitLogBuffer(cfg.MonitoringURL)
	defer lb.Close()
	idem := idempotency.NewIdempotencyCache()
	defer idem.Close()

	notifConn, err := amqp.Dial(cfg.RabbitURL)
	if err != nil {
		log.Fatalf("rabbitmq notification: %v", err)
	}
	defer notifConn.Close()

	notifBroker, err := broker.NewNotificationBroker(notifConn, cfg.RabbitNotificationQueue)
	if err != nil {
		log.Fatalf("notification broker: %v", err)
	}
	defer notifBroker.Close()

	fireNotifier, err := notification.NewFirebaseNotifier(context.Background(), cfg.FirebaseCredentialsPath)
	if err != nil {
		log.Fatalf("firebase: %v", err)
	}
	tokensClient := appnotif.NewUsersPushTokenClient(cfg.UsersURL, cfg.JWTSecret)
	notifConsumer, err := appnotif.NewNotificationConsumer(notifConn, fireNotifier, tokensClient, cfg.RabbitNotificationQueue)
	if err != nil {
		log.Fatalf("notification consumer: %v", err)
	}
	defer notifConsumer.Close()
	ctxNotif, cancelNotif := context.WithCancel(context.Background())
	defer cancelNotif()
	if err := notifConsumer.Start(ctxNotif); err != nil {
		log.Fatalf("notification consumer start: %v", err)
	}

	accRepo := repository.NewAccountRepository(db)
	opRepo := repository.NewOperationRepository(db)
	fxProvider := client.NewFrankfurterClient(cfg.FXBaseURL)
	hub := realtime.NewHub()
	opsBroker, err := broker.NewOperationsBroker(cfg.RabbitURL, cfg.RabbitQueue)
	if err != nil {
		log.Fatalf("broker: %v", err)
	}
	defer opsBroker.Close()
	if err := opsBroker.Consume(func(op *entity.Operation) error {
		if err := opRepo.Create(op); err != nil {
			return err
		}
		hub.Publish(op)
		return nil
	}); err != nil {
		log.Fatalf("broker consume: %v", err)
	}

	opNotifier := &usecase.NotificationBrokerPublisher{B: notifBroker}
	uc := usecase.NewAccountUseCase(accRepo, opRepo, fxProvider, opsBroker, opNotifier)
	handler := delivery.NewHandler(uc, cfg.JWTSecret, hub)

	r := chi.NewRouter()
	r.Use(tracing.TracingMiddleware("core", lb))
	r.Use(thttp.ChaosMiddleware)
	r.Use(idempotency.IdempotencyMiddleware(idem))
	r.Route("/", handler.Mount)

	log.Printf("Core service listening on :%s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatal(err)
	}
}
