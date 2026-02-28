# Internet Bank Backend

Бэкенд интернет-банка: три микросервиса (Core, Users, Credits) на Go, GORM, API Gateway (Nginx).

## Структура

```
backend/
├── cmd/
│   ├── core/
│   ├── users/
│   └── credits/
├── internal/
│   ├── core/
│   ├── users/
│   └── credits/
├── pkg/
│   ├── config/
│   ├── auth/
│   └── response/
├── gateway/          # Nginx-конфиг для API Gateway
├── openapi/          # openapi.yml
├── build/            # Dockerfile’ы сервисов
├── scripts/          # init-db.sql
├── go.mod
└── docker-compose.yml
```

## Запуск через Docker Compose

Из каталога **backend/**:

```bash
cd /backend
docker compose up -d --build
```

- Поднимаются: Postgres (порт **5433** на хосте), Core (8001), Users (8002), Credits (8003), **Gateway (8080)**.
- БД создаются скриптом `scripts/init-db.sql`.
- Зависимости качаются при сборке (`go mod download` в Dockerfile).

## Единая точка входа (API Gateway)

Для фронта и мобилки все запросы идут на один хост:

**Базовый URL:** `http://localhost:8080`

- `POST /auth/login`, `POST /auth/refresh` → Users  
- `GET/POST/PATCH /users`, `/users/{id}` → Users  
- `GET/POST/DELETE /accounts`, `/accounts/{id}/deposit`, `/withdraw`, `/operations` → Core  
- `GET/POST /tariffs`, `GET/POST /credits`, `/credits/{id}/repay` → Credits  

Заголовок `Authorization: Bearer <token>` проксируется. CORS: `Access-Control-Allow-Origin: *`.

## Локальный запуск (без Docker)

1. Запустить PostgreSQL и создать БД:

   ```sql
   CREATE DATABASE core;
   CREATE DATABASE users;
   CREATE DATABASE credits;
   ```

2. Из каталога **backend/** в трёх терминалах:

   ```bash
   go run ./cmd/core
   go run ./cmd/users
   go run ./cmd/credits
   ```

   Без Gateway запросы идут напрямую: Core — 8001, Users — 8002, Credits — 8003.

## Переменные окружения (локальный запуск)

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `CORE_PORT` | Порт Core | 8001 |
| `CORE_DSN` | DSN Postgres для Core | host=localhost user=postgres password=postgres dbname=core port=5432 sslmode=disable |
| `USERS_PORT` | Порт Users | 8002 |
| `USERS_DSN` | DSN для Users | ... dbname=users ... |
| `CREDITS_PORT` | Порт Credits | 8003 |
| `CREDITS_DSN` | DSN для Credits | ... dbname=credits ... |
| `JWT_SECRET` | Секрет JWT | change-me-in-production |
| `JWT_ACCESS_TTL_MIN` | TTL access-токена (мин) | 15 |
| `JWT_REFRESH_TTL_MIN` | TTL refresh-токена (мин) | 10080 (7 дней) |
| `CORE_URL` | URL Core для Credits | http://localhost:8001 |

## API

- Спека: **asyncapi/asyncapi.yaml** (все эндпоинты через API Gateway, пагинация `limit`/`offset` у списков).

Защищённые эндпоинты: заголовок `Authorization: Bearer <access_token>`.

## Первый запуск

При старте сервиса Users создаётся сотрудник по умолчанию:

- **Email:** `admin@bank.local`  
- **Пароль:** `admin`

Логин через Gateway:

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bank.local","password":"admin"}'
```

В ответе — `token`, `refresh_token`, `user_id`, `type`. Дальше все запросы с заголовком `Authorization: Bearer <token>`.

