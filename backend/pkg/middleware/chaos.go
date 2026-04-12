package middleware

import (
	"math/rand"
	"net/http"
	"time"
)

func ChaosMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		now := time.Now()
		minute := now.Minute()

		// 30% error rate on odd minutes, 70% on even minutes
		errorRate := 30
		if minute%2 == 0 {
			errorRate = 70
		}

		// Случайное решение на каждый запрос. Раньше использовался hash(path+method) —
		// для одного и того же маршрута (например POST /auth/login) значение всегда
		// одинаковое; при hash%100 < 30 хаос срабатывал на 100% запросов в любую минуту.
		if rand.Intn(100) < errorRate {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"error":"chaos: simulated server error"}`))
			return
		}

		next.ServeHTTP(w, r)
	})
}
