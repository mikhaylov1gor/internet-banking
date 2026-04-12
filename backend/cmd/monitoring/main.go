package main

import (
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"internet-bank/internal/monitoring/delivery"
	"internet-bank/internal/monitoring/entity"
	"internet-bank/internal/monitoring/repository"
	"internet-bank/internal/monitoring/usecase"
	"internet-bank/pkg/config"
)

func main() {
	cfg := config.LoadMonitoring()

	db, err := gorm.Open(postgres.Open(cfg.DSN), &gorm.Config{})
	if err != nil {
		log.Fatalf("db: %v", err)
	}

	if err := db.Migrator().AutoMigrate(&entity.RequestLog{}); err != nil {
		log.Fatalf("migrate: %v", err)
	}

	logsRepo := repository.NewLogsRepository(db)
	metricsUC := usecase.NewMetricsUseCase(logsRepo)
	ctx := delivery.NewHandlerContext(metricsUC, logsRepo)
	handler := delivery.NewHandler(ctx)

	r := chi.NewRouter()
	handler.Mount(r)

	log.Printf("Monitoring service listening on :%s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatal(err)
	}
}
