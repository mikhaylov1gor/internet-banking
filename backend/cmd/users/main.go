package main

import (
	"log"
	"net/http"

	"internet-bank/internal/users/delivery"
	"internet-bank/internal/users/entity"
	"internet-bank/internal/users/repository"
	"internet-bank/internal/users/usecase"
	"internet-bank/pkg/config"

	"github.com/go-chi/chi/v5"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	cfg, authCfg := config.LoadUsers()
	db, err := gorm.Open(postgres.Open(cfg.DSN), &gorm.Config{})
	if err != nil {
		log.Fatalf("db: %v", err)
	}
	if err := db.AutoMigrate(&entity.User{}); err != nil {
		log.Fatalf("migrate: %v", err)
	}

	userRepo := repository.NewUserRepository(db)
	userUC := usecase.NewUserUseCase(userRepo)
	if _, err := userUC.Create(entity.UserTypeEmployee, "admin@bank.local", "Admin", "", "admin"); err != nil {
		if err != usecase.ErrEmailExists {
			log.Printf("seed default employee: %v", err)
		}
	}
	authUC := usecase.NewAuthUseCase(userRepo, usecase.AuthConfig{
		JWTSecret:  authCfg.JWTSecret,
		AccessTTL:  authCfg.AccessTTL,
		RefreshTTL: authCfg.RefreshTTL,
	})
	handler := delivery.NewHandler(authUC, userUC, authCfg.JWTSecret, authCfg.SSOClients, authCfg.ForceSecureSSO)

	r := chi.NewRouter()
	r.Route("/", handler.Mount)

	log.Printf("Users service listening on :%s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatal(err)
	}
}
