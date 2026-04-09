package delivery

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	ctx *HandlerContext
}

func NewHandler(ctx *HandlerContext) *Handler {
	return &Handler{ctx: ctx}
}

func (h *Handler) Mount(r *chi.Mux) {
	r.Get("/", h.getDashboard)
	r.Get("/dashboard", h.getDashboard)
	r.Post("/logs", h.logRequest)
	r.Get("/summary", h.getSummary)
	r.Get("/errors", h.getErrors)
	r.Get("/metrics/summary", h.getSummary)
	r.Get("/metrics/errors", h.getErrors)
	r.Post("/metrics/logs", h.logRequest)
}

func (h *Handler) logRequest(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"logged"}`))
}

func (h *Handler) getSummary(w http.ResponseWriter, r *http.Request) {
	service := r.URL.Query().Get("service")
	from := time.Now().Add(-24 * time.Hour)
	to := time.Now()

	_, err := h.ctx.metricsUC.GetSummary(service, from, to)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error":"` + err.Error() + `"}`))
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok"}`))
}

func (h *Handler) getErrors(w http.ResponseWriter, r *http.Request) {
	service := r.URL.Query().Get("service")

	_, err := h.ctx.metricsUC.GetErrors(service, 50)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error":"` + err.Error() + `"}`))
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok"}`))
}

func (h *Handler) getDashboard(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`<!DOCTYPE html>
<html>
<head>
<title>Monitoring Dashboard</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
<h1>Banking System Monitoring</h1>
<canvas id="chart"></canvas>
</body>
</html>`))
}
