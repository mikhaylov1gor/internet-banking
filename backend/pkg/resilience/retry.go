package resilience

import (
	"io"
	"net/http"
	"time"
)

const (
	maxRetries     = 3
	initialBackoff = 100 * time.Millisecond
)

type RetryableHTTPClient struct {
	client *http.Client
}

func NewRetryableHTTPClient(timeout time.Duration) *RetryableHTTPClient {
	return &RetryableHTTPClient{
		client: &http.Client{Timeout: timeout},
	}
}

func (rc *RetryableHTTPClient) Do(req *http.Request) (*http.Response, error) {
	var lastErr error

	for attempt := 0; attempt < maxRetries; attempt++ {
		resp, err := rc.client.Do(req)
		if err == nil && shouldNotRetry(resp) {
			return resp, nil
		}

		if err != nil {
			lastErr = err
			if attempt < maxRetries-1 && shouldRetry(err, resp) {
				backoff := time.Duration(1<<uint(attempt)) * initialBackoff
				time.Sleep(backoff)
				continue
			}
		}

		if resp != nil && shouldRetry(nil, resp) {
			if attempt < maxRetries-1 {
				backoff := time.Duration(1<<uint(attempt)) * initialBackoff
				time.Sleep(backoff)
				io.ReadAll(resp.Body)
				resp.Body.Close()
				continue
			}
			return resp, nil
		}

		return resp, err
	}

	return nil, lastErr
}

func shouldRetry(err error, resp *http.Response) bool {
	if err != nil {
		return true
	}

	if resp == nil {
		return false
	}

	return resp.StatusCode >= 500
}

func shouldNotRetry(resp *http.Response) bool {
	if resp == nil {
		return false
	}
	return resp.StatusCode < 500
}
