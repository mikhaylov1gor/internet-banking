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
	JWTSecret               string
	FXBaseURL               string
	RabbitURL               string
	RabbitQueue             string
	RabbitNotificationQueue string
	MasterAccountID         string
	BankServiceUserID       string
	MasterInitialBalance    float64
	MasterCurrency          string
	FirebaseCredentialsPath string
	MonitoringURL           string
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
		jwtSecret = "supersecretjwtsecretforverysecuresecurity"
	}
	fxBaseURL := os.Getenv("FX_BASE_URL")
	if fxBaseURL == "" {
		fxBaseURL = "https://open.er-api.com/v6/latest"
	}
	rabbitURL := os.Getenv("RABBITMQ_URL")
	if rabbitURL == "" {
		rabbitURL = "amqp://guest:guest@rabbitmq:5672/"
	}
	rabbitQueue := os.Getenv("RABBITMQ_QUEUE")
	if rabbitQueue == "" {
		rabbitQueue = "core.operations"
	}
	masterAccountID := os.Getenv("MASTER_ACCOUNT_ID")
	if masterAccountID == "" {
		masterAccountID = "00000000-0000-0000-0000-000000000001"
	}
	bankServiceUserID := os.Getenv("BANK_SERVICE_USER_ID")
	if bankServiceUserID == "" {
		bankServiceUserID = "11111111-1111-1111-1111-111111111111"
	}
	masterInitialBalance := 1_000_000_000.0
	if s := os.Getenv("MASTER_ACCOUNT_INITIAL_BALANCE"); s != "" {
		if v, err := strconv.ParseFloat(s, 64); err == nil {
			masterInitialBalance = v
		}
	}
	masterCurrency := os.Getenv("MASTER_ACCOUNT_CURRENCY")
	if masterCurrency == "" {
		masterCurrency = "RUB"
	}
	rabbitNotificationQueue := os.Getenv("RABBITMQ_NOTIFICATION_QUEUE")
	if rabbitNotificationQueue == "" {
		rabbitNotificationQueue = "operations.created"
	}
	firebaseCredentialsPath := os.Getenv("FIREBASE_CREDENTIALS_PATH")
	monitoringURL := os.Getenv("MONITORING_URL")
	if monitoringURL == "" {
		monitoringURL = "http://monitoring:8005"
	}
	return CoreConfig{
		Config: Config{
			Port: port,
			DSN:  dsn,
		},
		JWTSecret:               jwtSecret,
		FXBaseURL:               fxBaseURL,
		RabbitURL:               rabbitURL,
		RabbitQueue:             rabbitQueue,
		RabbitNotificationQueue: rabbitNotificationQueue,
		MasterAccountID:         masterAccountID,
		BankServiceUserID:       bankServiceUserID,
		MasterInitialBalance:    masterInitialBalance,
		MasterCurrency:          masterCurrency,
		FirebaseCredentialsPath: firebaseCredentialsPath,
		MonitoringURL:           monitoringURL,
	}
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
		jwtSecret = "supersecretjwtsecretforverysecuresecurity"
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
	ssoClients := os.Getenv("SSO_CLIENTS")
	if ssoClients == "" {
		ssoClients = "client-app|any|http://localhost:3000/callback,employee-app|any|http://localhost:3001/callback"
	}
	forceSecureSSO := false
	if raw := os.Getenv("SSO_FORCE_SECURE_COOKIE"); raw != "" {
		if v, err := strconv.ParseBool(raw); err == nil {
			forceSecureSSO = v
		}
	}
	monitoringURL := os.Getenv("MONITORING_URL")
	if monitoringURL == "" {
		monitoringURL = "http://monitoring:8005"
	}
	return Config{Port: port, DSN: dsn}, UsersAuth{
		JWTSecret:      jwtSecret,
		AccessTTL:      accessTTL,
		RefreshTTL:     refreshTTL,
		SSOClients:     ssoClients,
		ForceSecureSSO: forceSecureSSO,
		MonitoringURL:  monitoringURL,
	}
}

type CreditsConfig struct {
	Config
	JWTSecret           string
	CoreURL             string
	MasterAccountID     string
	BankServiceUserID   string
	InternalTokenTTLMin int
	MonitoringURL       string
}

type AppSettingsConfig struct {
	Config
	JWTSecret string
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
		jwtSecret = "supersecretjwtsecretforverysecuresecurity"
	}
	coreURL := os.Getenv("CORE_URL")
	if coreURL == "" {
		coreURL = "http://localhost:8001"
	}
	masterAccountID := os.Getenv("MASTER_ACCOUNT_ID")
	if masterAccountID == "" {
		masterAccountID = "00000000-0000-0000-0000-000000000001"
	}
	bankServiceUserID := os.Getenv("BANK_SERVICE_USER_ID")
	if bankServiceUserID == "" {
		bankServiceUserID = "11111111-1111-1111-1111-111111111111"
	}
	internalTokenTTLMin := 15
	if ttl := os.Getenv("INTERNAL_TOKEN_TTL_MIN"); ttl != "" {
		if v, err := strconv.Atoi(ttl); err == nil && v > 0 {
			internalTokenTTLMin = v
		}
	}
	monitoringURL := os.Getenv("MONITORING_URL")
	if monitoringURL == "" {
		monitoringURL = "http://monitoring:8005"
	}
	return CreditsConfig{
		Config:              Config{Port: port, DSN: dsn},
		JWTSecret:           jwtSecret,
		CoreURL:             coreURL,
		MasterAccountID:     masterAccountID,
		BankServiceUserID:   bankServiceUserID,
		InternalTokenTTLMin: internalTokenTTLMin,
		MonitoringURL:       monitoringURL,
	}
}

func LoadAppSettings() AppSettingsConfig {
	port := os.Getenv("APP_SETTINGS_PORT")
	if port == "" {
		port = "8004"
	}
	dsn := os.Getenv("APP_SETTINGS_DSN")
	if dsn == "" {
		dsn = "host=localhost user=postgres password=postgres dbname=app_settings port=5432 sslmode=disable"
	}
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "supersecretjwtsecretforverysecuresecurity"
	}
	return AppSettingsConfig{Config: Config{Port: port, DSN: dsn}, JWTSecret: jwtSecret}
}

type UsersAuth struct {
	JWTSecret      string
	AccessTTL      int
	RefreshTTL     int
	SSOClients     string
	ForceSecureSSO bool
	MonitoringURL  string
}

type MonitoringConfig struct {
	Config
}

func LoadMonitoring() MonitoringConfig {
	port := os.Getenv("MONITORING_PORT")
	if port == "" {
		port = "8005"
	}
	dsn := os.Getenv("MONITORING_DSN")
	if dsn == "" {
		dsn = "host=localhost user=postgres password=postgres dbname=monitoring port=5432 sslmode=disable"
	}
	return MonitoringConfig{
		Config: Config{
			Port: port,
			DSN:  dsn,
		},
	}
}
