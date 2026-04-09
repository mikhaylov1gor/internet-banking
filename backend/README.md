# Internet Bank Backend

Бэкенд интернет-банка: микросервисы Core, Users, Credits и App Settings на Go, GORM, API Gateway (Nginx).

## Структура

```
backend/
├── cmd/
│   ├── core/
│   ├── users/
│   ├── credits/
│   └── appsettings/
├── internal/
│   ├── core/
│   ├── users/
│   ├── credits/
│   └── appsettings/
├── pkg/
│   ├── config/
│   ├── auth/
│   └── response/
├── gateway/          # Nginx-конфиг для API Gateway
├── openapi/          # openapi.yaml
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

- Поднимаются: Postgres (порт **5433** на хосте), Core (8001), Users (8002), Credits (8003), App Settings (8004), **Gateway (8080)**.
- БД создаются скриптом `scripts/init-db.sql`.
- Зависимости качаются при сборке (`go mod download` в Dockerfile).

## Единая точка входа (API Gateway)

Для фронта и мобилки все запросы идут на один хост:

**Базовый URL:** `http://localhost:8080`

- `POST /auth/login`, `POST /auth/refresh` → Users  
- `GET/POST/PATCH /users`, `/users/{id}` → Users  
- `POST /fx/convert` → Core (калькулятор курса, без токена)  
- `GET/POST/DELETE /accounts`, `/accounts/{id}/deposit`, `/withdraw`, `/operations` → Core  
- `GET/POST /tariffs`, `GET/POST /credits`, `POST /credits/availability` (ликвидность мастер-счёта), `/credits/{id}/repay` → Credits  
- `GET/PUT /app-settings/{appType}` → App Settings  

Заголовок `Authorization: Bearer <token>` проксируется. CORS: `Access-Control-Allow-Origin: *`.

## SSO-аутентификация

Реализован SSO-поток через Auth сервис по модели OAuth2 Authorization Code + PKCE.

- Пользователь вводит логин/пароль только на странице Auth сервиса: `GET /sso/login`
- Клиенты (веб/мобилка/приложение сотрудника) начинают вход через `GET /sso/authorize`
- После входа Auth сервис делает redirect на `redirect_uri` с `code`
- Клиент меняет `code` на токены через `POST /sso/token`

Базовые SSO-эндпоинты через gateway:

- `GET /sso/authorize`
- `GET /sso/login`
- `POST /sso/login`
- `POST /sso/token`

## Локальный запуск (без Docker)

1. Запустить PostgreSQL и создать БД:

   ```sql
   CREATE DATABASE core;
   CREATE DATABASE users;
   CREATE DATABASE credits;
   CREATE DATABASE app_settings;
   ```

2. Из каталога **backend/** в трёх терминалах:

   ```bash
   go run ./cmd/core
   go run ./cmd/users
   go run ./cmd/credits
   go run ./cmd/appsettings
   ```

   Без Gateway запросы идут напрямую: Core — 8001, Users — 8002, Credits — 8003.

## Переменные окружения (локальный запуск)

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `CORE_PORT` | Порт Core | 8001 |
| `CORE_DSN` | DSN Postgres для Core | host=localhost user=postgres password=postgres dbname=core port=5432 sslmode=disable |
| `FX_BASE_URL` | Базовый URL API курсов валют | https://api.frankfurter.app |
| `RABBITMQ_URL` | URL брокера RabbitMQ | amqp://guest:guest@rabbitmq:5672/ |
| `RABBITMQ_QUEUE` | Очередь операций Core | core.operations |
| `MASTER_ACCOUNT_ID` | UUID мастер-счёта (создаётся при старте Core, если ещё нет) | 00000000-0000-0000-0000-000000000001 |
| `BANK_SERVICE_USER_ID` | UUID «владельца» мастер-счёта в Core (client_id счёта) | 11111111-1111-1111-1111-111111111111 |
| `MASTER_ACCOUNT_INITIAL_BALANCE` | Начальный баланс мастер-счёта при первом создании | 1000000000 |
| `MASTER_ACCOUNT_CURRENCY` | Валюта мастер-счёта | RUB |
| `USERS_PORT` | Порт Users | 8002 |
| `USERS_DSN` | DSN для Users | ... dbname=users ... |
| `SSO_CLIENTS` | Реестр OAuth-клиентов в формате `client_id|role|redirect_uri` через запятую (`role`: `client`, `employee`, `any`) | client-app\|any\|http://localhost:3000/callback,employee-app\|any\|http://localhost:3001/callback |
| `SSO_FORCE_SECURE_COOKIE` | Принудительно выставлять `Secure` для SSO-cookie | false |
| `CREDITS_PORT` | Порт Credits | 8003 |
| `CREDITS_DSN` | DSN для Credits | ... dbname=credits ... |
| `MASTER_ACCOUNT_ID` | Должен совпадать с Core — тот же UUID мастер-счёта | 00000000-0000-0000-0000-000000000001 |
| `BANK_SERVICE_USER_ID` | Должен совпадать с Core — для внутреннего JWT | 11111111-1111-1111-1111-111111111111 |
| `INTERNAL_TOKEN_TTL_MIN` | TTL внутреннего service-to-service access token (мин) | 15 |
| `APP_SETTINGS_PORT` | Порт App Settings | 8004 |
| `APP_SETTINGS_DSN` | DSN для App Settings | ... dbname=app_settings ... |
| `JWT_SECRET` | Секрет JWT | change-me-in-production |
| `JWT_ACCESS_TTL_MIN` | TTL access-токена (мин) | 15 |
| `JWT_REFRESH_TTL_MIN` | TTL refresh-токена (мин) | 10080 (7 дней) |
| `CORE_URL` | URL Core для Credits | http://localhost:8001 |

## API

- Спеки:
  - `openapi/openapi.yaml` — HTTP API через gateway
  - пагинация списков в HTTP: `page` и `page_size`

Защищённые эндпоинты: заголовок `Authorization: Bearer <access_token>`.

## WebSocket и очередь операций

- Список операций по счёту доступен по WebSocket:
  - `GET /ws/accounts/{accountId}/operations?page=1&page_size=50`
- Паттерн обновлений: **push full snapshot + incremental updates**
  - при подключении отправляется `operations_snapshot`
  - при новой операции отправляется `operation_created`
- Новые операции (deposit/withdraw/transfer) сначала публикуются в очередь RabbitMQ, затем consumer Core читает очередь, сохраняет операции в PostgreSQL и пушит обновления в WS.

## Конвертация валют при переводе

- Поддерживаются минимум 3 валюты счёта: `RUB`, `USD`, `EUR`.
- При переводе между счетами с разной валютой Core автоматически запрашивает актуальный курс и выполняет конвертацию.
- Используется бесплатный API без токена: [Frankfurter API](https://frankfurter.app/).
- Источник курса настраивается через `FX_BASE_URL`.

## Мастер-счёт для кредитов

- При старте **Core** при необходимости создаётся счёт с `MASTER_ACCOUNT_ID` (номер `9999999999999999`), баланс — `MASTER_ACCOUNT_INITIAL_BALANCE`.
- Сервис **Credits** должен использовать те же `MASTER_ACCOUNT_ID` и `BANK_SERVICE_USER_ID`, что и Core (см. `docker-compose.yml`). При старте Credits проверяет наличие мастер-счёта в Core; при отсутствии процесс завершится с понятным сообщением (частая причина — разный `JWT_SECRET` у Core и Credits или старый Core без bootstrap).
- При выдаче кредита деньги переводятся с мастер-счёта на счёт клиента; при погашении — обратно.
- Перевод идёт через `/accounts/transfer`, баланс мастер-счёта не уходит в минус.

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

### Проверочный сценарий: тариф → счёт → кредит → погашение

При поднятом stack (`docker compose up -d`) из каталога `backend`:

```powershell
.\scripts\e2e-credit-flow.ps1
```

Скрипт: логин сотрудника → создание тарифа → новый клиент → счёт → выдача кредита 1000 → проверка баланса → полное погашение → баланс 0. Базовый URL: `http://localhost:8080` или переменная `API_BASE`.

