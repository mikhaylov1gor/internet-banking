package client

import (
	"encoding/json"
	"fmt"
	"net/http"
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
		baseURL = "https://open.er-api.com/v6/latest"
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
	u := fmt.Sprintf("%s/%s", c.baseURL, from)
	resp, err := c.client.Get(u)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("не удалось получить курс валют: код %d", resp.StatusCode)
	}
	var body struct {
		Result string             `json:"result"`
		Rates  map[string]float64 `json:"rates"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return 0, err
	}
	if body.Result != "" && body.Result != "success" {
		return 0, fmt.Errorf("не удалось получить курс валют")
	}
	rate, ok := body.Rates[string(to)]
	if !ok || rate <= 0 {
		return 0, fmt.Errorf("курс для %s/%s не найден", from, to)
	}
	return rate, nil
}
