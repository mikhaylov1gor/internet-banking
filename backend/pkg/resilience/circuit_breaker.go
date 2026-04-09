package resilience

import (
	"errors"
	"net/http"
	"sync"
	"time"
)

const (
	stateClosed      = "CLOSED"
	stateOpen        = "OPEN"
	stateHalfOpen    = "HALF_OPEN"
	errorThreshold   = 0.7
	successThreshold = 5
	timeout          = 30 * time.Second
	windowDuration   = 1 * time.Minute
)

var ErrCircuitOpen = errors.New("circuit breaker is open")

type CircuitBreaker struct {
	mu              sync.RWMutex
	state           string
	errorCount      int
	successCount    int
	lastErrorTime   time.Time
	lastStateChange time.Time
	requests        int
}

func NewCircuitBreaker() *CircuitBreaker {
	return &CircuitBreaker{
		state: stateClosed,
	}
}

func (cb *CircuitBreaker) Call(fn func() (*http.Response, error)) (*http.Response, error) {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	// Check state transitions
	switch cb.state {
	case stateOpen:
		if time.Since(cb.lastStateChange) > timeout {
			cb.state = stateHalfOpen
			cb.successCount = 0
			cb.errorCount = 0
		} else {
			return nil, ErrCircuitOpen
		}
	}

	// Execute the function
	resp, err := fn()

	// Update state based on result
	if err != nil || (resp != nil && resp.StatusCode >= 500) {
		cb.errorCount++
		cb.requests++
		cb.lastErrorTime = time.Now()

		errorRate := float64(cb.errorCount) / float64(cb.requests)
		if cb.state == stateClosed && errorRate > errorThreshold && cb.requests > 10 {
			cb.state = stateOpen
			cb.lastStateChange = time.Now()
		}

		if cb.state == stateHalfOpen {
			cb.state = stateOpen
			cb.lastStateChange = time.Now()
		}
	} else {
		cb.successCount++

		if cb.state == stateHalfOpen && cb.successCount >= successThreshold {
			cb.state = stateClosed
			cb.errorCount = 0
			cb.successCount = 0
			cb.requests = 0
		}
	}

	// Clean up metrics periodically
	if cb.requests > 100 {
		cb.requests = 0
		cb.errorCount = 0
		cb.successCount = 0
	}

	return resp, err
}

func (cb *CircuitBreaker) GetState() string {
	cb.mu.RLock()
	defer cb.mu.RUnlock()
	return cb.state
}
