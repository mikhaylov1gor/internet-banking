package tracing

import (
	"context"
	"net/http"
	"time"
)

const TraceIDKey = "trace-id"

func TracingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		traceID := r.Header.Get(TraceIDKey)
		if traceID == "" {
			traceID = GenerateTraceID()
		}

		ctx := context.WithValue(r.Context(), TraceIDKey, traceID)
		w.Header().Set(TraceIDKey, traceID)

		start := time.Now()
		wrapped := &responseWriter{ResponseWriter: w}

		next.ServeHTTP(wrapped, r.WithContext(ctx))

		duration := time.Since(start).Milliseconds()
		logEntry := LogEntry{
			Timestamp:  time.Now().UTC().Format(time.RFC3339),
			TraceID:    traceID,
			Service:    "core",
			Endpoint:   r.URL.Path,
			Method:     r.Method,
			StatusCode: wrapped.statusCode,
			DurationMs: duration,
		}

		_ = logEntry // TODO: Send to monitoring service
	})
}

type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func (rw *responseWriter) Write(b []byte) (int, error) {
	if rw.statusCode == 0 {
		rw.statusCode = 200
	}
	return rw.ResponseWriter.Write(b)
}

func GetTraceID(ctx context.Context) string {
	if traceID, ok := ctx.Value(TraceIDKey).(string); ok {
		return traceID
	}
	return ""
}
