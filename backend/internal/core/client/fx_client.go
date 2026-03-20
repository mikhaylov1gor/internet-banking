package client

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"internet-bank/internal/core/entity"
)

type FXRateProvider interface {
	Rate(from, to entity.Currency) (float64, error)
}

type frankfurterClient struct {
	baseURL string
	client  *http.Client
}

func NewFrankfurterClient(baseURL string) FXRateProvider {
	if baseURL == "" {
		baseURL = "https://api.frankfurter.app"
	}
	return &frankfurterClient{
		baseURL: strings.TrimRight(baseURL, "/"),
		client:  &http.Client{Timeout: 10 * time.Second},
	}
}

func (c *frankfurterClient) Rate(from, to entity.Currency) (float64, error) {
	if from == to {
		return 1, nil
	}
	u := fmt.Sprintf("%s/latest?from=%s&to=%s", c.baseURL, url.QueryEscape(string(from)), url.QueryEscape(string(to)))
	resp, err := c.client.Get(u)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("не удалось получить курс валют: код %d", resp.StatusCode)
	}
	var body struct {
		Rates map[string]float64 `json:"rates"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return 0, err
	}
	rate, ok := body.Rates[string(to)]
	if !ok || rate <= 0 {
		return 0, fmt.Errorf("курс для %s/%s не найден", from, to)
	}
	return rate, nil
}
