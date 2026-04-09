package middleware

import (
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

		// Simple hash-based decision
		hashVal := hashRequest(r) % 100
		if hashVal < errorRate {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"error":"chaos: simulated server error"}`))
			return
		}

		next.ServeHTTP(w, r)
	})
}

func hashRequest(r *http.Request) int {
	hash := 0
	for _, ch := range r.URL.Path + r.Method {
		hash = (hash<<5 - hash) + int(ch)
	}
	if hash < 0 {
		hash = -hash
	}
	return hash
}
