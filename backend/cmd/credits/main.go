package main

import (
	"errors"
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
	"internet-bank/pkg/idempotency"
	mw "internet-bank/pkg/middleware"
	"internet-bank/pkg/tracing"

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
	internalTokenFn := func() (string, error) {
		return auth.NewAccessToken(bankServiceUserID, auth.UserTypeEmployee, cfg.JWTSecret, cfg.InternalTokenTTLMin)
	}
	tok, err := internalTokenFn()
	if err != nil {
		log.Fatalf("внутренний JWT: %v", err)
	}
	if _, err := coreClient.GetAccount(masterAccountID, tok); err != nil {
		if errors.Is(err, client.ErrAccountNotFound) {
			log.Fatalf("мастер-счёт %s не найден в Core. Проверьте CORE_URL и JWT_SECRET (как у Core), что Core пересобран с bootstrap (логи: master account created/ok). Команда: docker compose up -d --build core", masterAccountID)
		}
		log.Fatalf("мастер-счёт недоступен в Core: %v", err)
	}
	tariffUC := usecase.NewTariffUseCase(tariffRepo)
	creditUC := usecase.NewCreditUseCase(tariffRepo, creditRepo, coreClient, masterAccountID, internalTokenFn)
	handler := delivery.NewHandler(tariffUC, creditUC, cfg.JWTSecret)

	lb := tracing.InitLogBuffer(cfg.MonitoringURL)
	defer lb.Close()
	idem := idempotency.NewIdempotencyCache()
	defer idem.Close()

	r := chi.NewRouter()
	r.Use(tracing.TracingMiddleware("credits", lb))
	r.Use(mw.ChaosMiddleware)
	r.Use(idempotency.IdempotencyMiddleware(idem))
	handler.Mount(r)

	go func() {
		runAutoRepay := func() {
			res, err := creditUC.RunDailyAutoRepay()
			if err != nil {
				log.Printf("daily auto-repay: %v", err)
				return
			}
			log.Printf(
				"daily auto-repay done: checked=%d charged=%d skipped=%d failed=%d total=%.2f",
				res.CheckedCredits, res.ChargedCredits, res.SkippedCredits, res.FailedCredits, res.TotalRepayAmount,
			)
		}
		runAutoRepay()
		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			runAutoRepay()
		}
	}()

	log.Printf("Credits service listening on :%s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatal(err)
	}
}
