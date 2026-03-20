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
	"internet-bank/pkg/auth"
	"internet-bank/pkg/config"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
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
	masterAccountID, err := uuid.Parse(cfg.MasterAccountID)
	if err != nil {
		log.Fatalf("MASTER_ACCOUNT_ID: %v", err)
	}
	bankServiceUserID, err := uuid.Parse(cfg.BankServiceUserID)
	if err != nil {
		log.Fatalf("BANK_SERVICE_USER_ID: %v", err)
	}
	internalAuthToken, err := auth.NewAccessToken(bankServiceUserID, auth.UserTypeEmployee, cfg.JWTSecret, cfg.InternalTokenTTLMin)
	if err != nil {
		log.Fatalf("internal token: %v", err)
	}
	tariffUC := usecase.NewTariffUseCase(tariffRepo)
	creditUC := usecase.NewCreditUseCase(tariffRepo, creditRepo, coreClient, masterAccountID, internalAuthToken)
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
