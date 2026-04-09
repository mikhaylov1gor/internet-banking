package main

import (
	"log"
	"net/http"

	"internet-bank/internal/appsettings/delivery"
	"internet-bank/internal/appsettings/entity"
	"internet-bank/internal/appsettings/repository"
	"internet-bank/internal/appsettings/usecase"
	"internet-bank/pkg/config"

	"github.com/go-chi/chi/v5"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	cfg := config.LoadAppSettings()
	db, err := gorm.Open(postgres.Open(cfg.DSN), &gorm.Config{})
	if err != nil {
		log.Fatalf("db: %v", err)
	}
	if err := db.AutoMigrate(&entity.AppSettings{}); err != nil {
		log.Fatalf("migrate: %v", err)
	}

	repo := repository.NewSettingsRepository(db)
	uc := usecase.NewSettingsUseCase(repo)
	handler := delivery.NewHandler(uc, cfg.JWTSecret)

	r := chi.NewRouter()
	r.Route("/", handler.Mount)

	log.Printf("AppSettings service listening on :%s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatal(err)
	}
}
