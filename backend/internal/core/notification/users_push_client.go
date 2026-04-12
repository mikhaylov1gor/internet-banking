package notification

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
)

type UsersPushTokenClient struct {
	baseURL string
	secret  string
	client  *http.Client
}

func NewUsersPushTokenClient(baseURL, internalSecret string) *UsersPushTokenClient {
	return &UsersPushTokenClient{
		baseURL: strings.TrimRight(strings.TrimSpace(baseURL), "/"),
		secret:  internalSecret,
		client:  &http.Client{Timeout: 10 * time.Second},
	}
}

type tokensResponse struct {
	Tokens []string `json:"tokens"`
}

func (c *UsersPushTokenClient) ClientTokens(ctx context.Context, userID uuid.UUID) ([]string, error) {
	if c.baseURL == "" {
		return nil, nil
	}
	url := fmt.Sprintf("%s/internal/push/client-tokens?user_id=%s", c.baseURL, userID.String())
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("X-Internal-Token", c.secret)
	resp, err := c.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("users push tokens: status %d", resp.StatusCode)
	}
	var out tokensResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, err
	}
	return out.Tokens, nil
}

func (c *UsersPushTokenClient) EmployeeTokens(ctx context.Context) ([]string, error) {
	if c.baseURL == "" {
		return nil, nil
	}
	url := fmt.Sprintf("%s/internal/push/employee-tokens", c.baseURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("X-Internal-Token", c.secret)
	resp, err := c.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("users employee tokens: status %d", resp.StatusCode)
	}
	var out tokensResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, err
	}
	return out.Tokens, nil
}
