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
	GetAccount(accountID uuid.UUID, bearerToken string) (*AccountInfo, error)
	Deposit(accountID uuid.UUID, amount float64, bearerToken string) error
	Withdraw(accountID uuid.UUID, amount float64, bearerToken string) error
	Transfer(fromAccountID, toAccountID uuid.UUID, amount float64, bearerToken string) error
	PreviewTransfer(fromAccountID, toAccountID uuid.UUID, amount float64, bearerToken string) (*TransferQuote, error)
}

type AccountInfo struct {
	ID       uuid.UUID `json:"id"`
	ClientID uuid.UUID `json:"client_id"`
	Balance  float64   `json:"balance"`
	Currency string    `json:"currency"`
	Status   string    `json:"status"`
}

type TransferQuote struct {
	FromAccountID uuid.UUID `json:"from_account_id"`
	ToAccountID   uuid.UUID `json:"to_account_id"`
	FromCurrency  string    `json:"from_currency"`
	ToCurrency    string    `json:"to_currency"`
	DebitAmount   float64   `json:"debit_amount"`
	CreditAmount  float64   `json:"credit_amount"`
	Rate          float64   `json:"rate"`
}

type coreClient struct {
	baseURL string
	client  *http.Client
}

func NewCoreClient(baseURL string) CoreClient {
	return &coreClient{baseURL: baseURL, client: &http.Client{}}
}

func parseJSONError(body []byte) string {
	if len(body) == 0 {
		return ""
	}
	var errBody struct {
		Error string `json:"error"`
	}
	if json.Unmarshal(body, &errBody) == nil && errBody.Error != "" {
		return errBody.Error
	}
	return strings.TrimSpace(string(body))
}

func (c *coreClient) GetAccount(accountID uuid.UUID, bearerToken string) (*AccountInfo, error) {
	url := fmt.Sprintf("%s/accounts/%s", c.baseURL, accountID.String())
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	setBearer(req, bearerToken)
	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrCoreUnavailable, err)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, mapCoreHTTPError(resp.StatusCode, parseJSONError(body))
	}
	var acc AccountInfo
	if err := json.Unmarshal(body, &acc); err != nil {
		return nil, err
	}
	return &acc, nil
}

func setBearer(req *http.Request, bearerToken string) {
	if bearerToken == "" {
		return
	}
	authVal := bearerToken
	if !strings.HasPrefix(bearerToken, "Bearer ") {
		authVal = "Bearer " + bearerToken
	}
	req.Header.Set("Authorization", authVal)
}

func (c *coreClient) Deposit(accountID uuid.UUID, amount float64, bearerToken string) error {
	return c.changeBalance(accountID, amount, "deposit", bearerToken)
}

func (c *coreClient) Withdraw(accountID uuid.UUID, amount float64, bearerToken string) error {
	return c.changeBalance(accountID, amount, "withdraw", bearerToken)
}

func (c *coreClient) Transfer(fromAccountID, toAccountID uuid.UUID, amount float64, bearerToken string) error {
	body, _ := json.Marshal(map[string]any{
		"from_account_id": fromAccountID.String(),
		"to_account_id":   toAccountID.String(),
		"amount":          amount,
	})
	url := fmt.Sprintf("%s/accounts/transfer", c.baseURL)
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	setBearer(req, bearerToken)
	resp, err := c.client.Do(req)
	if err != nil {
		return fmt.Errorf("%w: %v", ErrCoreUnavailable, err)
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return mapCoreHTTPError(resp.StatusCode, parseJSONError(raw))
	}
	return nil
}

func (c *coreClient) PreviewTransfer(fromAccountID, toAccountID uuid.UUID, amount float64, bearerToken string) (*TransferQuote, error) {
	body, _ := json.Marshal(map[string]any{
		"from_account_id": fromAccountID.String(),
		"to_account_id":   toAccountID.String(),
		"amount":          amount,
	})
	url := fmt.Sprintf("%s/accounts/transfer/preview", c.baseURL)
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	setBearer(req, bearerToken)
	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrCoreUnavailable, err)
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, mapCoreHTTPError(resp.StatusCode, parseJSONError(raw))
	}
	var quote TransferQuote
	if err := json.Unmarshal(raw, &quote); err != nil {
		return nil, err
	}
	return &quote, nil
}

func (c *coreClient) changeBalance(accountID uuid.UUID, amount float64, op string, bearerToken string) error {
	body, _ := json.Marshal(map[string]float64{"amount": amount})
	url := fmt.Sprintf("%s/accounts/%s/%s", c.baseURL, accountID.String(), op)
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	setBearer(req, bearerToken)
	resp, err := c.client.Do(req)
	if err != nil {
		return fmt.Errorf("%w: %v", ErrCoreUnavailable, err)
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return mapCoreHTTPError(resp.StatusCode, parseJSONError(raw))
	}
	return nil
}
