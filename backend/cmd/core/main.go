package main

import (
	"log"
	"net/http"

	"internet-bank/internal/core/delivery"
	"internet-bank/internal/core/entity"
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

	accRepo := repository.NewAccountRepository(db)
	opRepo := repository.NewOperationRepository(db)
	uc := usecase.NewAccountUseCase(accRepo, opRepo)
	handler := delivery.NewHandler(uc, cfg.JWTSecret)

	r := chi.NewRouter()
	r.Route("/", handler.Mount)

	log.Printf("Core service listening on :%s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatal(err)
	}
}
