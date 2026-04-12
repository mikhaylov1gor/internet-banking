package tracing

import (
	"context"
	"net/http"
	"strings"
	"time"
)

const TraceIDKey = "trace-id"

// maxErrorBodyLen limits how much of the response body is stored for 4xx/5xx (JSON error payloads, etc.).
const maxErrorBodyLen = 2048

// TracingMiddleware records request duration and status, forwards trace-id, and ships logs to the monitoring buffer.
func TracingMiddleware(serviceName string, lb *LogBuffer) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
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
			entry := LogEntry{
				Timestamp:  time.Now().UTC().Format(time.RFC3339Nano),
				TraceID:    traceID,
				Service:    serviceName,
				Endpoint:   r.URL.Path,
				Method:     r.Method,
				StatusCode: wrapped.statusCode,
				DurationMs: duration,
			}
			if msg := wrapped.errorSnippet(); msg != "" {
				entry.ErrorMsg = &msg
			}
			if lb != nil {
				lb.AddLog(&entry)
			}
		})
	}
}

type responseWriter struct {
	http.ResponseWriter
	statusCode int
	captureErr bool
	errBuf     []byte
}

func (rw *responseWriter) errorSnippet() string {
	if rw.statusCode < 400 || len(rw.errBuf) == 0 {
		return ""
	}
	s := strings.ToValidUTF8(string(rw.errBuf), "")
	return strings.TrimSpace(s)
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	if code >= 400 {
		rw.captureErr = true
		rw.errBuf = rw.errBuf[:0]
	}
	rw.ResponseWriter.WriteHeader(code)
}

func (rw *responseWriter) Write(b []byte) (int, error) {
	if rw.statusCode == 0 {
		rw.statusCode = 200
	}
	if rw.captureErr && len(rw.errBuf) < maxErrorBodyLen {
		space := maxErrorBodyLen - len(rw.errBuf)
		if len(b) < space {
			space = len(b)
		}
		if space > 0 {
			rw.errBuf = append(rw.errBuf, b[:space]...)
		}
	}
	return rw.ResponseWriter.Write(b)
}

func GetTraceID(ctx context.Context) string {
	if traceID, ok := ctx.Value(TraceIDKey).(string); ok {
		return traceID
	}
	return ""
}
