# Patch notes: изменения бэкенда для фронта и мобилки

Версия: см. `openapi/openapi.yaml` и актуальный `docker-compose`. Базовый URL через gateway: `http://localhost:8080` (в проде — ваш URL API Gateway).

---

## Общее (веб и мобилка)

### Намеренная нестабильность (chaos)

Сервисы **Core**, **Users**, **Credits** с заданной вероятностью отвечают **500** с телом вроде:

```json
{"error":"chaos: simulated server error"}
```

- В **нечётные минуты** — около **30%** запросов с ошибкой.
- В **чётные минуты** — около **70%**.

**Ожидание от клиентов:** повтор запроса с backoff, индикатор загрузки, дружелюбное сообщение при длительной недоступности.

### Идемпотентность

Для **POST**, **PUT**, **PATCH**, **DELETE** поддерживается заголовок:

```http
Idempotency-Key: <уникальная строка на одну бизнес-операцию>
```

Повтор того же запроса (тот же ключ, тот же пользователь в контексте кэша, тот же метод и path) может вернуть закэшированный ответ с заголовком:

```http
X-Idempotency-Cache: true
```

Ответы со статусом **5xx** в кэш **не записываются**.

### Трассировка

- Заголовок запроса (опционально): **`trace-id`**
- Если не передан — сервер генерирует и возвращает в ответе тот же **`trace-id`**

Удобно для поддержки и связки с логами мониторинга.

### CORS (gateway)

В `Access-Control-Allow-Headers` добавлены в том числе:

- `Idempotency-Key`
- `trace-id`
- `X-Requested-With`

---

## Веб (frontend)

### Мониторинг и дашборд

| Назначение | Метод и путь (через gateway) |
|------------|------------------------------|
| HTML-дашборд | `GET /monitoring/dashboard` |
| Сводка метрик | `GET /monitoring/summary?service=core` (пустой `service` = все сервисы) |
| Ошибки | `GET /monitoring/errors?service=core&limit=50` |
| Данные для графиков | `GET /monitoring/dashboard/data?service=` |

Рекомендуемый вход: **`/monitoring/`** (со слэшем). Запрос **`/monitoring`** без слэша редиректит на **`/monitoring/`**.

### Телеметрия с браузера

Отправка событий на бэкенд мониторинга:

```http
POST /monitoring/client-logs
Content-Type: application/json
```

Тело — **JSON-массив** объектов:

| Поле | Тип | Описание |
|------|-----|----------|
| `service` | string | Например `web-client`, `employee-web` (если пусто — по умолчанию `web-client`) |
| `trace_id` | string | Опционально |
| `endpoint` | string | Путь запроса к API |
| `method` | string | HTTP-метод |
| `status_code` | number | HTTP-статус ответа |
| `duration_ms` | number | Длительность на клиенте, мс |
| `timestamp` | string | RFC3339, опционально |
| `error_msg` | string | Опционально |

Пример:

```json
[
  {
    "service": "web-client",
    "trace_id": "550e8400-e29b-41d4-a716-446655440000",
    "endpoint": "/accounts",
    "method": "GET",
    "status_code": 200,
    "duration_ms": 145,
    "timestamp": "2026-04-12T15:30:00Z"
  }
]
```

### Push (веб: FCM / Web Push)

После успешного логина зарегистрировать токен:

```http
POST /users/push/device
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "token": "<fcm или web push token>",
  "platform": "web"
}
```

Роль (клиент / сотрудник) определяется по JWT. Уведомления о **новых операциях** уходят **владельцу счёта (клиент)** и **всем зарегистрированным сотрудникам** (по ТЗ курса).

### Кредиты и circuit breaker

При перегрузке/ошибках цепочки **Credits → Core** возможен ответ **503** с сообщением о временном отключении сервиса счетов. Имеет смысл отображать отдельно от «обычного» 500 и chaos.

---

## Мобилка (Android / iOS)

### Поведение API

Те же правила: **chaos**, **`Idempotency-Key`**, **`trace-id`**, обработка **503** от credits — как в разделе «Общее» и «Веб».

### Push

```http
POST /users/push/device
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "token": "<FCM token>",
  "platform": "android"
}
```

Для iOS в `platform` можно передавать, например, `ios` — на стороне users сохраняется строка как есть (вместе с ролью из JWT).

### Телеметрия (опционально)

Тот же эндпоинт, что у веба:

```http
POST /monitoring/client-logs
```

Рекомендуется **явно** задавать `service`, например:

- `mobile-android-client`
- `mobile-ios-client`
- `mobile-android-employee`

чтобы в мониторинге отличать мобильный трафик от веба.

---

## Чеклист интеграции

| Задача | Веб | Мобилка |
|--------|-----|---------|
| Retry / backoff при 5xx | ✅ | ✅ |
| `Idempotency-Key` на изменяющие запросы | ✅ | ✅ |
| `trace-id` | ✅ | ✅ |
| `POST /users/push/device` после логина | ✅ | ✅ |
| `POST /monitoring/client-logs` | ✅ по необходимости | ✅ по необходимости |
| Отдельная обработка 503 (credits / core) | ✅ | ✅ |

---

## Примечание про Firebase

Реальная отправка push через Firebase включается при наличии **`FIREBASE_CREDENTIALS_PATH`** у сервиса Core. Без файла credentials нотификатор работает в **mock-режиме** (логирование в консоль), но очередь и контракт API регистрации токенов остаются теми же.
