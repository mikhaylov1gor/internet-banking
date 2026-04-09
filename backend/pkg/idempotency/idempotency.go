package idempotency

import (
	"crypto/sha256"
	"fmt"
	"net/http"
	"sync"
	"time"
)

const (
	idempotencyKeyHeader = "Idempotency-Key"
	cacheTTL             = 10 * time.Minute
	cleanupInterval      = 5 * time.Minute
)

type IdempotencyCache struct {
	cache sync.Map
	done  chan struct{}
}

type cacheEntry struct {
	value      []byte
	expiresAt  time.Time
	statusCode int
}

func NewIdempotencyCache() *IdempotencyCache {
	ic := &IdempotencyCache{
		done: make(chan struct{}),
	}
	go ic.cleanupLoop()
	return ic
}

func (ic *IdempotencyCache) Get(key string) ([]byte, int, bool) {
	val, ok := ic.cache.Load(key)
	if !ok {
		return nil, 0, false
	}

	entry := val.(cacheEntry)
	if time.Now().After(entry.expiresAt) {
		ic.cache.Delete(key)
		return nil, 0, false
	}

	return entry.value, entry.statusCode, true
}

func (ic *IdempotencyCache) Set(key string, value []byte, statusCode int) {
	entry := cacheEntry{
		value:      value,
		statusCode: statusCode,
		expiresAt:  time.Now().Add(cacheTTL),
	}
	ic.cache.Store(key, entry)
}

func (ic *IdempotencyCache) cleanupLoop() {
	ticker := time.NewTicker(cleanupInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			now := time.Now()
			ic.cache.Range(func(key, value interface{}) bool {
				entry := value.(cacheEntry)
				if now.After(entry.expiresAt) {
					ic.cache.Delete(key)
				}
				return true
			})
		case <-ic.done:
			return
		}
	}
}

func (ic *IdempotencyCache) Close() {
	close(ic.done)
}

func generateCacheKey(idempotencyKey, userID, method, path string) string {
	data := fmt.Sprintf("%s:%s:%s:%s", idempotencyKey, userID, method, path)
	hash := sha256.Sum256([]byte(data))
	return fmt.Sprintf("%x", hash)
}

func IdempotencyMiddleware(cache *IdempotencyCache) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			idempotencyKey := r.Header.Get(idempotencyKeyHeader)
			if idempotencyKey == "" {
				// No idempotency key, proceed normally
				next.ServeHTTP(w, r)
				return
			}

			userID := r.Header.Get("X-User-ID")
			cacheKey := generateCacheKey(idempotencyKey, userID, r.Method, r.URL.Path)

			// Check if we've seen this request before
			if cachedValue, statusCode, ok := cache.Get(cacheKey); ok {
				w.Header().Set("Content-Type", "application/json")
				w.Header().Set("X-Idempotency-Cache", "true")
				w.WriteHeader(statusCode)
				w.Write(cachedValue)
				return
			}

			// Capture the response
			wrappedWriter := &responseCapture{ResponseWriter: w, statusCode: 200}
			next.ServeHTTP(wrappedWriter, r)

			// Cache the response
			if wrappedWriter.statusCode < 500 {
				cache.Set(cacheKey, wrappedWriter.body, wrappedWriter.statusCode)
			}
		})
	}
}

type responseCapture struct {
	http.ResponseWriter
	statusCode int
	body       []byte
}

func (rc *responseCapture) WriteHeader(statusCode int) {
	rc.statusCode = statusCode
	rc.ResponseWriter.WriteHeader(statusCode)
}

func (rc *responseCapture) Write(b []byte) (int, error) {
	rc.body = append(rc.body, b...)
	return rc.ResponseWriter.Write(b)
}
