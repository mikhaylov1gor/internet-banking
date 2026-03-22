package main

import (
	"log"
	"net/http"

	"internet-bank/internal/core/bootstrap"
	"internet-bank/internal/core/broker"
	"internet-bank/internal/core/client"
	"internet-bank/internal/core/delivery"
	"internet-bank/internal/core/entity"
	"internet-bank/internal/core/realtime"
	"internet-bank/internal/core/repository"
	"internet-bank/internal/core/usecase"
	"internet-bank/pkg/config"

	"github.com/go-chi/chi/v5"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	cfg := config.LoadCore()
	db, err := gorm.Open(postgres.Open(cfg.DSN), &gorm.Config{})
	if err != nil {
		log.Fatalf("db: %v", err)
	}
	if err := db.AutoMigrate(&entity.Account{}, &entity.Operation{}); err != nil {
		log.Fatalf("migrate: %v", err)
	}
	if err := bootstrap.EnsureMasterAccount(db, cfg); err != nil {
		log.Fatalf("master account: %v", err)
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
	uc := usecase.NewAccountUseCase(accRepo, opRepo, fxProvider, opsBroker)
	handler := delivery.NewHandler(uc, cfg.JWTSecret, hub)

	r := chi.NewRouter()
	r.Route("/", handler.Mount)

	log.Printf("Core service listening on :%s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatal(err)
	}
}
