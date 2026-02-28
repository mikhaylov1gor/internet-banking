package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port string
	DSN  string
}

type CoreConfig struct {
	Config
	JWTSecret string
}

func LoadCore() CoreConfig {
	port := os.Getenv("CORE_PORT")
	if port == "" {
		port = "8001"
	}
	dsn := os.Getenv("CORE_DSN")
	if dsn == "" {
		dsn = "host=localhost user=postgres password=postgres dbname=core port=5432 sslmode=disable"
	}
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "change-me-in-production"
	}
	return CoreConfig{Config: Config{Port: port, DSN: dsn}, JWTSecret: jwtSecret}
}

func LoadUsers() (Config, UsersAuth) {
	port := os.Getenv("USERS_PORT")
	if port == "" {
		port = "8002"
	}
	dsn := os.Getenv("USERS_DSN")
	if dsn == "" {
		dsn = "host=localhost user=postgres password=postgres dbname=users port=5432 sslmode=disable"
	}
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "change-me-in-production"
	}
	accessTTL := 15
	if ttl := os.Getenv("JWT_ACCESS_TTL_MIN"); ttl != "" {
		if v, err := strconv.Atoi(ttl); err == nil {
			accessTTL = v
		}
	}
	refreshTTL := 60 * 24 * 7
	if ttl := os.Getenv("JWT_REFRESH_TTL_MIN"); ttl != "" {
		if v, err := strconv.Atoi(ttl); err == nil {
			refreshTTL = v
		}
	}
	return Config{Port: port, DSN: dsn}, UsersAuth{
		JWTSecret:  jwtSecret,
		AccessTTL:  accessTTL,
		RefreshTTL: refreshTTL,
	}
}

type CreditsConfig struct {
	Config
	JWTSecret string
	CoreURL   string
}

func LoadCredits() CreditsConfig {
	port := os.Getenv("CREDITS_PORT")
	if port == "" {
		port = "8003"
	}
	dsn := os.Getenv("CREDITS_DSN")
	if dsn == "" {
		dsn = "host=localhost user=postgres password=postgres dbname=credits port=5432 sslmode=disable"
	}
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "change-me-in-production"
	}
	coreURL := os.Getenv("CORE_URL")
	if coreURL == "" {
		coreURL = "http://localhost:8001"
	}
	return CreditsConfig{Config: Config{Port: port, DSN: dsn}, JWTSecret: jwtSecret, CoreURL: coreURL}
}

type UsersAuth struct {
	JWTSecret  string
	AccessTTL  int
	RefreshTTL int
}
