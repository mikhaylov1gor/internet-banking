package delivery

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"internet-bank/internal/monitoring/entity"
	"internet-bank/pkg/tracing"
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
	r.Get("/dashboard/data", h.getDashboardData)
	r.Post("/logs", h.logRequest)
	r.Post("/client-logs", h.clientLogs)
	r.Get("/summary", h.getSummary)
	r.Get("/errors", h.getErrors)
	r.Get("/metrics/summary", h.getSummary)
	r.Get("/metrics/errors", h.getErrors)
	r.Post("/metrics/logs", h.logRequest)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeJSONError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func (h *Handler) logRequest(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "read body: "+err.Error())
		return
	}

	var entries []tracing.LogEntry
	if err := json.Unmarshal(body, &entries); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid JSON array: "+err.Error())
		return
	}

	logs, err := tracingEntriesToRequestLogs(entries)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := h.ctx.logsRepo.CreateBatch(logs); err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"status": "logged", "count": len(logs)})
}

// ClientLogEntry is telemetry from web/mobile clients (browser fetch).
type ClientLogEntry struct {
	Service    string  `json:"service"`
	TraceID    string  `json:"trace_id"`
	Endpoint   string  `json:"endpoint"`
	Method     string  `json:"method"`
	StatusCode int     `json:"status_code"`
	DurationMs int64   `json:"duration_ms"`
	ErrorMsg   *string `json:"error_msg,omitempty"`
	Timestamp  string  `json:"timestamp"`
}

func (h *Handler) clientLogs(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "read body: "+err.Error())
		return
	}

	var entries []ClientLogEntry
	if err := json.Unmarshal(body, &entries); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid JSON array: "+err.Error())
		return
	}

	now := time.Now().UTC()
	logs := make([]*entity.RequestLog, 0, len(entries))
	for _, e := range entries {
		if e.Service == "" {
			e.Service = "web-client"
		}
		ts := now
		if e.Timestamp != "" {
			if t, err := time.Parse(time.RFC3339Nano, e.Timestamp); err == nil {
				ts = t.UTC()
			} else if t, err := time.Parse(time.RFC3339, e.Timestamp); err == nil {
				ts = t.UTC()
			}
		}
		if e.TraceID == "" {
			e.TraceID = tracing.GenerateTraceID()
		}
		logs = append(logs, &entity.RequestLog{
			ID:         uuid.New(),
			Timestamp:  ts,
			TraceID:    e.TraceID,
			Service:    e.Service,
			Endpoint:   e.Endpoint,
			Method:     e.Method,
			StatusCode: e.StatusCode,
			DurationMs: e.DurationMs,
			UserID:     nil,
			ErrorMsg:   e.ErrorMsg,
		})
	}
	if err := h.ctx.logsRepo.CreateBatch(logs); err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"status": "logged", "count": len(logs)})
}

func tracingEntriesToRequestLogs(entries []tracing.LogEntry) ([]*entity.RequestLog, error) {
	logs := make([]*entity.RequestLog, 0, len(entries))
	for i := range entries {
		e := &entries[i]
		if e.TraceID == "" {
			e.TraceID = tracing.GenerateTraceID()
		}
		if e.Service == "" {
			return nil, fmt.Errorf("entry missing service")
		}
		ts, err := time.Parse(time.RFC3339Nano, e.Timestamp)
		if err != nil {
			ts, err = time.Parse(time.RFC3339, e.Timestamp)
		}
		if err != nil {
			ts = time.Now().UTC()
		} else {
			ts = ts.UTC()
		}
		var uid *uuid.UUID
		if e.UserID != nil && *e.UserID != "" {
			if u, err := uuid.Parse(*e.UserID); err == nil {
				uid = &u
			}
		}
		logs = append(logs, &entity.RequestLog{
			ID:         uuid.New(),
			Timestamp:  ts,
			TraceID:    e.TraceID,
			Service:    e.Service,
			Endpoint:   e.Endpoint,
			Method:     e.Method,
			StatusCode: e.StatusCode,
			DurationMs: e.DurationMs,
			UserID:     uid,
			ErrorMsg:   e.ErrorMsg,
		})
	}
	return logs, nil
}

func (h *Handler) getSummary(w http.ResponseWriter, r *http.Request) {
	service := r.URL.Query().Get("service")
	from, to := parseTimeRange(r)
	summary, err := h.ctx.metricsUC.GetSummary(service, from, to)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, summary)
}

func (h *Handler) getErrors(w http.ResponseWriter, r *http.Request) {
	service := r.URL.Query().Get("service")
	limit := 50
	if s := r.URL.Query().Get("limit"); s != "" {
		if v, err := strconv.Atoi(s); err == nil && v > 0 && v <= 500 {
			limit = v
		}
	}
	entries, err := h.ctx.metricsUC.GetErrors(service, limit)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"errors": entries})
}

func (h *Handler) getDashboardData(w http.ResponseWriter, r *http.Request) {
	service := r.URL.Query().Get("service")
	from, to := parseTimeRange(r)
	data, err := h.ctx.metricsUC.GetDashboardData(service, from, to)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, data)
}

func parseTimeRange(r *http.Request) (from, to time.Time) {
	to = time.Now()
	from = to.Add(-24 * time.Hour)
	if s := r.URL.Query().Get("from"); s != "" {
		if t, err := time.Parse(time.RFC3339, s); err == nil {
			from = t
		}
	}
	if s := r.URL.Query().Get("to"); s != "" {
		if t, err := time.Parse(time.RFC3339, s); err == nil {
			to = t
		}
	}
	return from, to
}

func (h *Handler) getDashboard(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(dashboardHTML))
}

const dashboardHTML = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>Monitoring</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<style>
body { font-family: system-ui, sans-serif; margin: 1rem; max-width: 1200px; }
label { margin-right: 0.5rem; }
input { padding: 0.25rem 0.5rem; margin-bottom: 1rem; }
canvas { max-height: 220px; margin-bottom: 2rem; }
table { border-collapse: collapse; width: 100%; font-size: 0.85rem; }
th, td { border: 1px solid #ccc; padding: 0.35rem; text-align: left; }
th { background: #f4f4f4; }
</style>
</head>
<body>
<h1>Мониторинг запросов</h1>
<p>Сервис (пусто = все): <input id="svc" placeholder="core, users, credits…" /></p>
<button type="button" id="reload">Обновить</button>
<h2>Сводка (24ч)</h2>
<pre id="summary"></pre>
<h2>Запросы по часам</h2>
<canvas id="reqChart"></canvas>
<canvas id="errChart"></canvas>
<canvas id="durChart"></canvas>
<h2>Последние запросы</h2>
<div id="table"></div>
<script>
function basePath() {
  const p = location.pathname.replace(/\/dashboard\/?$/, '');
  return p || '/monitoring';
}
async function load() {
  const svc = document.getElementById('svc').value.trim();
  const q = svc ? ('?service=' + encodeURIComponent(svc)) : '?service=';
  const b = basePath();
  const [sum, data] = await Promise.all([
    fetch(b + '/summary' + q).then(r => r.json()),
    fetch(b + '/dashboard/data' + q).then(r => r.json())
  ]);
  document.getElementById('summary').textContent = JSON.stringify(sum, null, 2);
  const labels = (data.request_counts || []).map(x => x.timestamp);
  const reqData = (data.request_counts || []).map(x => x.value);
  const errData = (data.error_rates || []).map(x => x.value);
  const durData = (data.avg_durations || []).map(x => x.value);
  const mk = (id, label, vals, yl) => {
    const el = document.getElementById(id);
    const prev = Chart.getChart(el);
    if (prev) prev.destroy();
    new Chart(el, {
      type: 'line',
      data: { labels, datasets: [{ label, data: vals, borderColor: '#2563eb', tension: 0.1 }] },
      options: { responsive: true, scales: { y: { title: { display: true, text: yl } } } }
    });
  };
  mk('reqChart', 'Запросов / час', reqData, 'count');
  mk('errChart', 'Ошибок % / час', errData, '%');
  mk('durChart', 'Средняя длительность мс / час', durData, 'ms');
  const rows = (data.recent_requests || []).map(r => {
    const ts = r.timestamp || '';
    return '<tr><td>' + ts + '</td><td>' + (r.service||'') + '</td><td>' + (r.method||'') + '</td><td>' + (r.endpoint||'') + '</td><td>' + r.status_code + '</td><td>' + r.duration_ms + '</td><td>' + (r.trace_id||'') + '</td></tr>';
  }).join('');
  document.getElementById('table').innerHTML = '<table><thead><tr><th>Время</th><th>Сервис</th><th>Method</th><th>Path</th><th>Код</th><th>мс</th><th>trace</th></tr></thead><tbody>' + rows + '</tbody></table>';
}
document.getElementById('reload').onclick = load;
load();
</script>
</body>
</html>`
