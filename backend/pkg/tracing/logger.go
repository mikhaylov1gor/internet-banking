package tracing

import (
	"bytes"
	"encoding/json"
	"net/http"
	"sync"
	"time"
)

const (
	logBufferSize  = 100
	flushInterval  = 5 * time.Second
	monitoringPath = "/logs"
)

type LogBuffer struct {
	buffer        []*LogEntry
	mutex         sync.Mutex
	monitoringURL string
	done          chan struct{}
	ticker        *time.Ticker
}

func InitLogBuffer(monitoringURL string) *LogBuffer {
	lb := &LogBuffer{
		buffer:        make([]*LogEntry, 0, logBufferSize),
		monitoringURL: monitoringURL,
		done:          make(chan struct{}),
		ticker:        time.NewTicker(flushInterval),
	}

	go lb.flushLoop()
	return lb
}

func (lb *LogBuffer) AddLog(entry *LogEntry) {
	lb.mutex.Lock()
	defer lb.mutex.Unlock()

	lb.buffer = append(lb.buffer, entry)

	if len(lb.buffer) >= logBufferSize {
		lb.flush()
	}
}

func (lb *LogBuffer) flushLoop() {
	for {
		select {
		case <-lb.ticker.C:
			lb.mutex.Lock()
			lb.flush()
			lb.mutex.Unlock()
		case <-lb.done:
			return
		}
	}
}

func (lb *LogBuffer) flush() {
	if len(lb.buffer) == 0 {
		return
	}

	go lb.logToMonitoring(lb.buffer)
	lb.buffer = make([]*LogEntry, 0, logBufferSize)
}

func (lb *LogBuffer) logToMonitoring(entries []*LogEntry) {
	payload, err := json.Marshal(entries)
	if err != nil {
		return
	}

	client := &http.Client{Timeout: 5 * time.Second}
	req, err := http.NewRequest("POST", lb.monitoringURL+monitoringPath, bytes.NewReader(payload))
	if err != nil {
		return
	}

	req.Header.Set("Content-Type", "application/json")
	_, _ = client.Do(req)
}

func (lb *LogBuffer) Close() {
	lb.ticker.Stop()
	close(lb.done)
}
