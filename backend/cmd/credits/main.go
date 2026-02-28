package main

import (
	"log"
	"net/http"
	"time"

	"internet-bank/internal/credits/client"
	"internet-bank/internal/credits/delivery"
	"internet-bank/internal/credits/entity"
	"internet-bank/internal/credits/repository"
	"internet-bank/internal/credits/usecase"
	"internet-bank/pkg/config"

	"github.com/go-chi/chi/v5"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	cfg := config.LoadCredits()
	db, err := gorm.Open(postgres.Open(cfg.DSN), &gorm.Config{})
	if err != nil {
		log.Fatalf("db: %v", err)
	}
	if err := db.AutoMigrate(&entity.CreditTariff{}, &entity.Credit{}); err != nil {
		log.Fatalf("migrate: %v", err)
	}

	tariffRepo := repository.NewTariffRepository(db)
	creditRepo := repository.NewCreditRepository(db)
	coreClient := client.NewCoreClient(cfg.CoreURL)
	tariffUC := usecase.NewTariffUseCase(tariffRepo)
	creditUC := usecase.NewCreditUseCase(tariffRepo, creditRepo, coreClient)
	handler := delivery.NewHandler(tariffUC, creditUC, cfg.JWTSecret)

	r := chi.NewRouter()
	handler.Mount(r)

	go func() {
		ticker := time.NewTicker(1 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			if err := creditUC.AccrueInterest(); err != nil {
				log.Printf("accrue interest: %v", err)
			}
		}
	}()

	log.Printf("Credits service listening on :%s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatal(err)
	}
}
