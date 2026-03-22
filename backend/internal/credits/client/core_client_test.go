package client

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/uuid"
)

func TestGetAccount_Maps404(t *testing.T) {
	id := uuid.New()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/accounts/"+id.String() {
			t.Fatalf("path %s", r.URL.Path)
		}
		w.WriteHeader(http.StatusNotFound)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "счёт не найден"})
	}))
	defer srv.Close()

	c := NewCoreClient(srv.URL)
	_, err := c.GetAccount(id, "tok")
	if err == nil {
		t.Fatal("expected error")
	}
	if !errors.Is(err, ErrAccountNotFound) {
		t.Fatalf("want ErrAccountNotFound, got %v", err)
	}
}

func TestGetAccount_Maps401(t *testing.T) {
	id := uuid.New()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "недействительный токен"})
	}))
	defer srv.Close()

	c := NewCoreClient(srv.URL)
	_, err := c.GetAccount(id, "bad")
	if !errors.Is(err, ErrUnauthorized) {
		t.Fatalf("want ErrUnauthorized, got %v", err)
	}
}

func TestGetAccount_Maps403(t *testing.T) {
	id := uuid.New()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusForbidden)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "доступ запрещён"})
	}))
	defer srv.Close()

	c := NewCoreClient(srv.URL)
	_, err := c.GetAccount(id, "tok")
	if !errors.Is(err, ErrAccountAccessDenied) {
		t.Fatalf("want ErrAccountAccessDenied, got %v", err)
	}
}

func TestGetAccount_NetworkError(t *testing.T) {
	c := NewCoreClient("http://127.0.0.1:1")
	_, err := c.GetAccount(uuid.New(), "t")
	if err == nil {
		t.Fatal("expected error")
	}
	if !errors.Is(err, ErrCoreUnavailable) {
		t.Fatalf("want ErrCoreUnavailable wrap, got %v", err)
	}
}
