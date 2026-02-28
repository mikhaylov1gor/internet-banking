package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/google/uuid"
)

type CoreClient interface {
	Deposit(accountID uuid.UUID, amount float64, bearerToken string) error
	Withdraw(accountID uuid.UUID, amount float64, bearerToken string) error
}

type coreClient struct {
	baseURL string
	client  *http.Client
}

func NewCoreClient(baseURL string) CoreClient {
	return &coreClient{baseURL: baseURL, client: &http.Client{}}
}

func (c *coreClient) Deposit(accountID uuid.UUID, amount float64, bearerToken string) error {
	return c.changeBalance(accountID, amount, "deposit", bearerToken)
}

func (c *coreClient) Withdraw(accountID uuid.UUID, amount float64, bearerToken string) error {
	return c.changeBalance(accountID, amount, "withdraw", bearerToken)
}

func (c *coreClient) changeBalance(accountID uuid.UUID, amount float64, op string, bearerToken string) error {
	body, _ := json.Marshal(map[string]float64{"amount": amount})
	url := fmt.Sprintf("%s/accounts/%s/%s", c.baseURL, accountID.String(), op)
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	if bearerToken != "" {
		authVal := bearerToken
		if !strings.HasPrefix(bearerToken, "Bearer ") {
			authVal = "Bearer " + bearerToken
		}
		req.Header.Set("Authorization", authVal)
	}
	resp, err := c.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		msg := string(body)
		if len(body) > 0 {
			var errBody struct {
				Error string `json:"error"`
			}
			if json.Unmarshal(body, &errBody) == nil && errBody.Error != "" {
				msg = errBody.Error
			}
		}
		if msg == "" {
			msg = fmt.Sprintf("сервис core вернул код %d", resp.StatusCode)
		}
		return fmt.Errorf("%s", msg)
	}
	return nil
}
