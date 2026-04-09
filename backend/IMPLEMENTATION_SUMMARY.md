# Backend Implementation Summary - Microservices Enhancement

**Date:** April 9, 2026  
**Status:** ✅ Complete Implementation

---

## 🎯 Overview

Backend микросервисной архитектуры был расширен с 6 критическими компонентами для обеспечения надежности, отслеживаемости и отказоустойчивости:

1. **Push-уведомления (Firebase)**
2. **Имитация нестабильности (Chaos Engineering)**
3. **Идемпотентность запросов**
4. **Трассировка и логирование**
5. **Микросервис мониторинга**
6. **Retry & Circuit Breaker паттерны**

---

## 📋 Детали реализации

### 1️⃣ PUSH-УВЕДОМЛЕНИЯ (Firebase)

**Что изменилось:**
- Добавлен новый пакет `pkg/notification/firebase.go` с поддержкой Firebase Admin SDK
- Core сервис теперь публикует события операций в RabbitMQ при создании
- Отдельный воркер слушает очередь `operations.created` и отправляет push-уведомления

**Для фронтенда:**
- 📱 **Web**: Используйте Firebase Cloud Messaging с Web SDK
- 📱 **Android**: Firebase Cloud Messaging (FCM)
- 📱 **iOS**: Не поддерживается в текущей реализации (требуется Apple Push Notification)

**Переменные окружения:**
```bash
FIREBASE_CREDENTIALS_PATH=path/to/firebase-adminsdk.json  # Firebase credentials
RABBITMQ_NOTIFICATION_QUEUE=operations.created            # Очередь уведомлений
```

**Формат события:**
```json
{
  "user_id": "uuid-of-user",
  "is_employee": false,          // true для сотрудников, false для клиентов
  "operation_type": "DEPOSIT",   // DEPOSIT, WITHDRAW, TRANSFER
  "amount": 1000.50,
  "operation": {...}             // Полный объект операции
}
```

**Логика доставки:**
- Клиент получает уведомления ТОЛЬКО своих операций
- Сотрудник получает уведомления ВСЕ операций всех клиентов

---

### 2️⃣ ИМИТАЦИЯ НЕСТАБИЛЬНОСТИ (Chaos Engineering)

**Что изменилось:**
- Добавлен middleware `pkg/middleware/chaos.go` во все 3 сервиса (core, users, credits)
- Сервисы имитируют ошибки с контролируемой вероятностью

**Поведение:**
- **Нечетные минуты**: 30% запросов возвращают 500 Internal Server Error
- **Четные минуты**: 70% запросов возвращают 500 Internal Server Error

**Для фронтенда:**
- ✅ **Обязательно** реализовать обработку 500 ошибок с retry
- ✅ Показывать пользователю уведомление о временной недоступности сервиса
- ✅ Использовать exponential backoff при повторных попытках

**Пример ошибки:**
```json
{
  "error": "chaos: simulated server error"
}
```

---

### 3️⃣ ИДЕМПОТЕНТНОСТЬ ЗАПРОСОВ

**Что изменилось:**
- Добавлен пакет `pkg/idempotency/idempotency.go` 
- Все POST/PUT запросы кэшируются на 10 минут по ключу идемпотентности

**Для фронтенда:**
- 📌 **Обязательно** добавьте заголовок для всех POST/PUT:
  ```
  Idempotency-Key: <unique-uuid-or-string>
  ```
- 📌 **ВАЖНО**: Используйте один и тот же `Idempotency-Key` для повторных попыток одного запроса
- 📌 Если сервер вернул кэшированный ответ, будет тот же результат

**Пример:**
```bash
# Первый запрос
curl -X POST http://localhost:8001/accounts/1234/deposit \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: txn-12345-unique" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}'

# Повторный запрос с тем же ключом вернет КЭШИРОВАННЫЙ результат
curl -X POST http://localhost:8001/accounts/1234/deposit \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: txn-12345-unique" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}'  # РЕЗУЛЬТАТ ИЗ КЭША
```

---

### 4️⃣ ТРАССИРОВКА И ЛОГИРОВАНИЕ

**Что изменилось:**
- Добавлены пакеты трассировки:
  - `pkg/tracing/tracer.go` - генерация trace ID
  - `pkg/tracing/middleware.go` - middleware для перехвата запросов
  - `pkg/tracing/logger.go` - структурированное логирование и отправка в мониторинг

**Для фронтенда:**
- 📊 **Опционально** добавляйте заголовок для всех запросов:
  ```
  X-Trace-Id: <your-trace-id>
  ```
- 📊 Если не добавите, сервер сгенерирует автоматически
- 📊 Сервер вернет `X-Trace-Id` в ответе для отслеживания

**Пример:**
```bash
curl -X GET http://localhost:8001/accounts \
  -H "Authorization: Bearer <token>" \
  -H "X-Trace-Id: my-custom-trace-123"

# Ответ содержит:
# X-Trace-Id: my-custom-trace-123 (или сгенерированный сервером)
```

**Собираемые метрики:**
- timestamp - время запроса
- trace_id - уникальный идентификатор для всей цепочки запросов
- service - core/users/credits
- endpoint - /accounts, /auth/login и т.д.
- method - GET/POST/PUT/DELETE
- status_code - 200, 500 и т.д.
- duration_ms - время выполнения в миллисекундах
- user_id - кто сделал запрос
- error_msg - текст ошибки (если была)

---

### 5️⃣ МИКРОСЕРВИС МОНИТОРИНГА

**Что изменилось:**
- Создан новый сервис `cmd/monitoring` (порт 8005)
- Собирает логи трассировки от всех 3 микросервисов
- Предоставляет веб-интерфейс с дашбордом
- Хранит данные в собственной БД (schema `monitoring`)

**Новые endpoints:**

#### Получить веб-интерфейс мониторинга
```
GET http://localhost:8080/monitoring/dashboard
```
Откроет интерактивный дашборд с графиками и таблицей запросов.

#### API для получения метрик
```bash
# Получить сводку по сервису за период
GET /monitoring/metrics/summary?service=core&from=2026-04-09T00:00:00Z&to=2026-04-09T23:59:59Z

Ответ:
{
  "service": "core",
  "avg_duration_ms": 125.5,
  "error_rate_pct": 25.5,     // Процент ошибок
  "request_count": 1000,
  "error_count": 255
}
```

```bash
# Получить последние ошибки
GET /monitoring/metrics/errors?service=core&limit=50

Ответ:
[
  {
    "id": "uuid",
    "timestamp": "2026-04-09T10:30:45Z",
    "trace_id": "uuid",
    "service": "core",
    "endpoint": "/accounts",
    "method": "POST",
    "error_msg": "database connection failed"
  },
  ...
]
```

#### Отправка логов (внутренний API)
```bash
POST /monitoring/metrics/logs
Content-Type: application/json

{
  "logs": [
    {
      "timestamp": "2026-04-09T10:30:45Z",
      "trace_id": "uuid",
      "service": "core",
      "endpoint": "/accounts",
      "method": "GET",
      "status_code": 200,
      "duration_ms": 45,
      "user_id": "uuid",
      "error_msg": null
    }
  ]
}
```

**Доступ:**
- Веб: http://localhost:8080/monitoring/dashboard
- API: http://localhost:8080/monitoring/metrics/*

---

### 6️⃣ RETRY & CIRCUIT BREAKER

**Что изменилось:**
- Добавлены пакеты отказоустойчивости:
  - `pkg/resilience/retry.go` - автоматические повторы с exponential backoff
  - `pkg/resilience/circuit_breaker.go` - защита от каскадных сбоев

**Поведение Retry:**
- Максимум 3 попытки
- Задержки: 100ms → 200ms → 400ms
- Повторяется только при 5xx ошибках и timeout

**Поведение Circuit Breaker:**
- Мониторит ошибки за последнюю минуту
- CLOSED (нормально): запросы проходят
- OPEN (> 70% ошибок): все запросы отклоняются с ошибкой
- HALF_OPEN (30сек после OPEN): пробует один запрос
- Если успех → CLOSED, если ошибка → снова OPEN

**Для фронтенда:**
- ✅ Обработайте ошибку: `"circuit breaker open for core"`
- ✅ Покажите пользователю: "Сервис недоступен, пожалуйста, повторите позже"
- ✅ Автоматически retry через 30+ секунд

---

## 📊 Логирование и Трассировка

Все запросы автоматически логируются и отправляются в мониторинг каждые 5 секунд батчами по 100 логов.

**Поток данных:**
```
Client Request 
  ↓
[Service] Middleware (Tracing + Logging)
  ↓
[Service] Processes request
  ↓
[Service] Middleware logs result
  ↓
[Service] Buffered Logger (собирает 100 логов или 5 сек)
  ↓
[Monitoring Service] HTTP POST /metrics/logs
  ↓
[PostgreSQL] Хранит в таблице request_logs
  ↓
[Dashboard] Отображает графики и таблицы
```

---

## 🔧 Переменные окружения

**Добавлены новые:**

```bash
# Core service
RABBITMQ_NOTIFICATION_QUEUE=operations.created
FIREBASE_CREDENTIALS_PATH=/path/to/credentials.json
MONITORING_URL=http://monitoring:8005

# Users service
MONITORING_URL=http://monitoring:8005

# Credits service
MONITORING_URL=http://monitoring:8005

# Monitoring service
MONITORING_PORT=8005
MONITORING_DSN=host=localhost user=postgres password=postgres dbname=monitoring port=5432 sslmode=disable
```

---

## 🗄️ База данных

**Новая схема:** `monitoring`

**Таблица:** `request_logs`
```sql
- id (UUID, primary key)
- timestamp (TIMESTAMP, indexed)
- trace_id (VARCHAR(36), indexed)
- service (VARCHAR(50), indexed) 
- endpoint (VARCHAR(255))
- method (VARCHAR(10))
- status_code (INT, indexed)
- duration_ms (BIGINT, indexed)
- user_id (UUID, nullable)
- error_msg (TEXT, nullable)
- created_at (TIMESTAMP)
```

---

## 🚀 Для фронтенда: Checklist интеграции

### Web (React/Vue)
- [ ] Добавить Firebase Web SDK и инициализировать
- [ ] Запрашивать permission для push-уведомлений
- [ ] Обновить все POST/PUT запросы - добавить `Idempotency-Key` заголовок
- [ ] Опционально: добавить `X-Trace-Id` для отслеживания
- [ ] Обработать статус код 500 с retry (желательно exponential backoff)
- [ ] Обработать ошибку "circuit breaker open" с отложенным retry
- [ ] Показывать уведомления пользователю при сбоях

### Android (Kotlin/Java)
- [ ] Добавить Firebase Cloud Messaging (FCM)
- [ ] Получить FCM token и отправить на бэк (в токен устройства)
- [ ] Реализовать FirebaseMessagingService для обработки push
- [ ] Обновить все POST/PUT запросы - добавить `Idempotency-Key`
- [ ] Обработать 500 ошибки с retry
- [ ] Синхронизировать логирование через X-Trace-Id (опционально)

### iOS (Swift)
- **Внимание:** Firebase Cloud Messaging в iOS требует Apple Push Notification Certificates
- Для MVP можно использовать только WebSocket (существующий /ws endpoint)
- Для push: настроить APNs certificate в Apple Developer Console

---

## 🔌 Интеграция с мониторингом

**Все логи автоматически отправляются в Monitoring Service**, вам ничего не нужно делать!

Просто используйте трассировку:

```javascript
// Frontend
const traceId = generateUUID();

fetch('http://localhost:8080/accounts', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Trace-Id': traceId,  // Опционально
    'Idempotency-Key': generateUUID()  // Для POST/PUT
  }
}).then(res => {
  const serverTraceId = res.headers.get('X-Trace-Id');
  // Используйте serverTraceId для поиска в мониторинге
});
```

---

## 📈 Метрики для аналитики

**В дашборде мониторинга вы можете видеть:**
- 📊 Request count по времени (количество запросов в минуту)
- 📊 Error rate (%) - сколько процентов запросов вернули ошибку
- 📊 Average response time (ms) - среднее время ответа
- 📊 Таблица последних запросов с деталями
- 📊 Фильтрация по сервису и временному диапазону

---

## ⚠️ Важные замечания

### 1. Firebase credentials
- Требуется файл `firebase-adminsdk.json`
- Если не предоставлен → notifications не работают (логируется warning)
- Получить: https://firebase.google.com/docs/admin/setup

### 2. Идемпотентность - обязательна!
- Все POST/PUT запросы ДОЛЖНЫ содержать `Idempotency-Key`
- Для связанных запросов используйте ОДИН `Idempotency-Key`
- Это предотвратит двойные операции при повторных попытках

### 3. Chaos engineering - реальное поведение
- 30% и 70% - это реальные вероятности, не сценарии!
- Ваш фронтенд ДОЛЖЕН справляться с этим
- В production сервисы будут более стабильны, но retry все равно нужен

### 4. Circuit Breaker - критично для resilience
- Если Core недоступен → Credits получит 30+ секунд timeout перед повторным подключением
- Не переводите сервис в Manual Failover без необходимости

---

## 🐳 Docker Compose

Добавлен новый сервис в docker-compose.yml:

```yaml
monitoring:
  build:
    context: .
    dockerfile: build/Dockerfile.monitoring
  ports:
    - "8005:8005"
  environment:
    MONITORING_PORT: "8005"
    MONITORING_DSN: "host=postgres ..."
  depends_on:
    postgres:
      condition: service_healthy
```

Запуск:
```bash
docker compose up -d --build
```

---

## 📝 Примеры API запросов

### Создать депозит с идемпотентностью
```bash
curl -X POST http://localhost:8080/accounts/1234/deposit \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Idempotency-Key: deposit-2026-04-09-unique-key" \
  -H "X-Trace-Id: trace-12345" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000.50,
    "description": "Refund"
  }'

# Ответ:
# HTTP/1.1 200 OK
# X-Trace-Id: trace-12345
# {
#   "id": "op-uuid",
#   "type": "DEPOSIT",
#   "amount": 1000.50,
#   "timestamp": "2026-04-09T10:30:45Z"
# }
```

### Получить метрики мониторинга
```bash
curl http://localhost:8080/monitoring/metrics/summary \
  ?service=core \
  &from=2026-04-09T00:00:00Z \
  &to=2026-04-09T23:59:59Z

# Ответ:
# {
#   "service": "core",
#   "avg_duration_ms": 125.5,
#   "error_rate_pct": 25.5,
#   "request_count": 1000,
#   "error_count": 255
# }
```

---

## ✅ Статус реализации

| Требование | Статус | Файлы |
|-----------|--------|-------|
| Push-уведомления Firebase | ✅ | pkg/notification/, internal/core/notification/ |
| Имитация нестабильности | ✅ | pkg/middleware/chaos.go |
| Идемпотентность | ✅ | pkg/idempotency/idempotency.go |
| Трассировка и логирование | ✅ | pkg/tracing/ |
| Микросервис мониторинга | ✅ | cmd/monitoring/, internal/monitoring/ |
| Retry & Circuit Breaker | ✅ | pkg/resilience/ |

**Все требования реализованы и готовы к использованию!** 🎉

---

## 📞 Поддержка

При возникновении вопросов:
1. Проверьте логи: `docker compose logs <service-name>`
2. Откройте дашборд мониторинга: http://localhost:8080/monitoring/dashboard
3. Посмотрите trace_id в дашборде для конкретного запроса
