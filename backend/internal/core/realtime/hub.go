package realtime

import (
	"sync"

	"internet-bank/internal/core/entity"

	"github.com/google/uuid"
)

type Hub struct {
	mu   sync.RWMutex
	subs map[uuid.UUID]map[chan *entity.Operation]struct{}
}

func NewHub() *Hub {
	return &Hub{
		subs: make(map[uuid.UUID]map[chan *entity.Operation]struct{}),
	}
}

func (h *Hub) Subscribe(accountID uuid.UUID) chan *entity.Operation {
	ch := make(chan *entity.Operation, 32)
	h.mu.Lock()
	defer h.mu.Unlock()
	if _, ok := h.subs[accountID]; !ok {
		h.subs[accountID] = make(map[chan *entity.Operation]struct{})
	}
	h.subs[accountID][ch] = struct{}{}
	return ch
}

func (h *Hub) Unsubscribe(accountID uuid.UUID, ch chan *entity.Operation) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if _, ok := h.subs[accountID]; !ok {
		return
	}
	delete(h.subs[accountID], ch)
	close(ch)
	if len(h.subs[accountID]) == 0 {
		delete(h.subs, accountID)
	}
}

func (h *Hub) Publish(op *entity.Operation) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for ch := range h.subs[op.AccountID] {
		select {
		case ch <- op:
		default:
		}
	}
}
