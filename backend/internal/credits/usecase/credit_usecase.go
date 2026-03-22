package usecase

import (
	"errors"
	"math"
	"time"

	"internet-bank/internal/credits/client"
	"internet-bank/internal/credits/entity"

	"github.com/google/uuid"
)

var (
	ErrCreditNotFound      = errors.New("кредит не найден")
	ErrAmountOutOfRange    = errors.New("сумма вне диапазона тарифа")
	ErrCreditNotActive     = errors.New("кредит не активен")
	ErrAccountWrongClient  = errors.New("счёт не принадлежит клиенту")
	ErrAccountNotOwned     = errors.New("счёт не принадлежит пользователю")
	ErrAccountInactive     = errors.New("счёт закрыт или заблокирован")
	ErrRepayAmountTooSmall = errors.New("сумма погашения не менее 0.01")
	ErrInsufficientFunds   = errors.New("недостаточно средств на счёте")
	ErrInternalToken       = errors.New("внутренний токен не настроен")
)

type CreditRepository interface {
	Create(c *entity.Credit) error
	GetByID(id uuid.UUID) (*entity.Credit, error)
	ListByClientID(clientID uuid.UUID, limit, offset int) ([]*entity.Credit, int64, error)
	Update(c *entity.Credit) error
	Delete(id uuid.UUID) error
	AccrueInterest() error
}

type CreditUseCase struct {
	tariffRepo      TariffRepository
	creditRepo      CreditRepository
	coreClient      client.CoreClient
	masterAccountID uuid.UUID
	internalTokenFn func() (string, error)
}

type CreditOverdue struct {
	CreditID        uuid.UUID `json:"credit_id"`
	ClientID        uuid.UUID `json:"client_id"`
	ExpectedPaid    float64   `json:"expected_paid"`
	ActualPaid      float64   `json:"actual_paid"`
	OverdueAmount   float64   `json:"overdue_amount"`
	OverduePayments int       `json:"overdue_payments"`
	MinutePayment   float64   `json:"minute_payment"`
}

type CreditRating struct {
	ClientID      uuid.UUID `json:"client_id"`
	Score         int       `json:"score"`
	RiskLevel     string    `json:"risk_level"`
	OverdueAmount float64   `json:"overdue_amount"`
	OverdueCount  int       `json:"overdue_count"`
}

type CreditPayment struct {
	Index         int       `json:"index"`
	DueAt         time.Time `json:"due_at"`
	ExpectedTotal float64   `json:"expected_total"`
	PaidNowTotal  float64   `json:"paid_now_total"`
	Status        string    `json:"status"`
}

type CreditPaymentList struct {
	Items        []CreditPayment `json:"items"`
	PageNumber   int             `json:"pageNumber"`
	PageQuantity int             `json:"pageQuantity"`
}

func NewCreditUseCase(
	tariffRepo TariffRepository,
	creditRepo CreditRepository,
	coreClient client.CoreClient,
	masterAccountID uuid.UUID,
	internalTokenFn func() (string, error),
) *CreditUseCase {
	return &CreditUseCase{
		tariffRepo:      tariffRepo,
		creditRepo:      creditRepo,
		coreClient:      coreClient,
		masterAccountID: masterAccountID,
		internalTokenFn: internalTokenFn,
	}
}

func (uc *CreditUseCase) getInternalToken() (string, error) {
	if uc.internalTokenFn == nil {
		return "", ErrInternalToken
	}
	return uc.internalTokenFn()
}

func dailyPayment(amount, annualRate float64) float64 {
	return amount * (annualRate / 365)
}

func (uc *CreditUseCase) Issue(clientID, accountID, tariffID uuid.UUID, amount float64, bearerToken string) (*entity.Credit, error) {
	tariff, err := uc.tariffRepo.GetByID(tariffID)
	if err != nil {
		return nil, ErrTariffNotFound
	}
	if amount < tariff.MinAmount || amount > tariff.MaxAmount {
		return nil, ErrAmountOutOfRange
	}
	if uc.coreClient != nil {
		internalToken, err := uc.getInternalToken()
		if err != nil {
			return nil, err
		}
		accInfo, err := uc.coreClient.GetAccount(accountID, internalToken)
		if err != nil {
			return nil, err
		}
		if accInfo.ClientID != clientID {
			return nil, ErrAccountWrongClient
		}
		if accInfo.Status != "active" {
			return nil, ErrAccountInactive
		}
	}
	daily := dailyPayment(amount, tariff.Rate)
	now := time.Now()
	c := &entity.Credit{
		ID:           uuid.New(),
		ClientID:     clientID,
		AccountID:    accountID,
		TariffID:     tariffID,
		Amount:       amount,
		Rate:         tariff.Rate,
		DailyPayment: daily,
		Remaining:    amount,
		IssuedAt:     now,
		Status:       entity.CreditStatusActive,
	}
	if err := uc.creditRepo.Create(c); err != nil {
		return nil, err
	}
	rollbackCredit := func() { _ = uc.creditRepo.Delete(c.ID) }
	if uc.coreClient != nil {
		internalToken, err := uc.getInternalToken()
		if err != nil {
			rollbackCredit()
			return nil, err
		}
		if err := uc.coreClient.Transfer(uc.masterAccountID, accountID, amount, internalToken); err != nil {
			rollbackCredit()
			return nil, err
		}
	}
	return c, nil
}

func (uc *CreditUseCase) GetByID(id uuid.UUID) (*entity.Credit, error) {
	return uc.creditRepo.GetByID(id)
}

func (uc *CreditUseCase) ListByClientID(clientID uuid.UUID, limit, offset int) ([]*entity.Credit, int64, error) {
	return uc.creditRepo.ListByClientID(clientID, limit, offset)
}

func (uc *CreditUseCase) Repay(creditID uuid.UUID, accountID uuid.UUID, amount float64, userID uuid.UUID, bearerToken string) (*entity.Credit, error) {
	if amount < 0.01 {
		return nil, ErrRepayAmountTooSmall
	}
	c, err := uc.creditRepo.GetByID(creditID)
	if err != nil {
		return nil, ErrCreditNotFound
	}
	if c.Status != entity.CreditStatusActive {
		return nil, ErrCreditNotActive
	}
	accInfo, err := uc.coreClient.GetAccount(accountID, bearerToken)
	if err != nil {
		return nil, err
	}
	if accInfo.ClientID != userID {
		return nil, ErrAccountNotOwned
	}
	if accInfo.Status != "active" {
		return nil, ErrAccountInactive
	}
	toRepay := math.Min(amount, c.Remaining)
	// Проверить наличие денег
	if accInfo.Balance < toRepay {
		return nil, ErrInsufficientFunds
	}
	if uc.coreClient != nil {
		internalToken, err := uc.getInternalToken()
		if err != nil {
			return nil, err
		}
		if err := uc.coreClient.Transfer(accountID, uc.masterAccountID, toRepay, internalToken); err != nil {
			return nil, err
		}
	}
	c.Remaining -= toRepay
	if c.Remaining <= 0 || c.Remaining < 0.01 {
		c.Remaining = 0
		c.Status = entity.CreditStatusPaid
		if err := uc.creditRepo.Delete(creditID); err != nil {
			return nil, err
		}
		return c, nil
	}
	if err := uc.creditRepo.Update(c); err != nil {
		return nil, err
	}
	return c, nil
}

func (uc *CreditUseCase) AccrueInterest() error {
	return uc.creditRepo.AccrueInterest()
}

func (uc *CreditUseCase) GetOverdue(creditID uuid.UUID) (*CreditOverdue, error) {
	c, err := uc.creditRepo.GetByID(creditID)
	if err != nil {
		return nil, ErrCreditNotFound
	}
	now := time.Now()
	elapsedMinutes := int(now.Sub(c.IssuedAt).Minutes())
	if elapsedMinutes < 0 {
		elapsedMinutes = 0
	}
	minutePayment := c.DailyPayment / 1440
	if minutePayment < 0.01 {
		minutePayment = 0.01
	}
	expectedPaid := math.Min(c.Amount, float64(elapsedMinutes)*minutePayment)
	actualPaid := c.Amount - c.Remaining
	overdueAmount := expectedPaid - actualPaid
	if overdueAmount < 0 {
		overdueAmount = 0
	}
	overduePayments := 0
	if overdueAmount > 0 {
		overduePayments = int(math.Ceil(overdueAmount / minutePayment))
	}
	return &CreditOverdue{
		CreditID:        c.ID,
		ClientID:        c.ClientID,
		ExpectedPaid:    round2(expectedPaid),
		ActualPaid:      round2(actualPaid),
		OverdueAmount:   round2(overdueAmount),
		OverduePayments: overduePayments,
		MinutePayment:   round2(minutePayment),
	}, nil
}

func (uc *CreditUseCase) GetPayments(creditID uuid.UUID, page, pageSize int, onlyOverdue bool) (*CreditPaymentList, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 50
	}
	c, err := uc.creditRepo.GetByID(creditID)
	if err != nil {
		return nil, ErrCreditNotFound
	}
	now := time.Now()
	elapsedMinutes := int(now.Sub(c.IssuedAt).Minutes())
	if elapsedMinutes < 0 {
		elapsedMinutes = 0
	}
	minutePayment := c.DailyPayment / 1440
	if minutePayment < 0.01 {
		minutePayment = 0.01
	}
	totalPayments := int(math.Ceil(c.Amount / minutePayment))
	if totalPayments < 1 {
		totalPayments = 1
	}
	actualPaid := c.Amount - c.Remaining
	payments := make([]CreditPayment, 0, totalPayments)
	for i := 1; i <= totalPayments; i++ {
		expected := math.Min(c.Amount, float64(i)*minutePayment)
		dueAt := c.IssuedAt.Add(time.Duration(i) * time.Minute)
		status := "pending"
		if dueAt.Before(now) || dueAt.Equal(now) {
			if actualPaid+0.000001 >= expected {
				status = "paid"
			} else {
				status = "overdue"
			}
		}
		if onlyOverdue && status != "overdue" {
			continue
		}
		payments = append(payments, CreditPayment{
			Index:         i,
			DueAt:         dueAt,
			ExpectedTotal: round2(expected),
			PaidNowTotal:  round2(actualPaid),
			Status:        status,
		})
	}
	total := len(payments)
	start := (page - 1) * pageSize
	if start > total {
		start = total
	}
	end := start + pageSize
	if end > total {
		end = total
	}
	pageQuantity := (total + pageSize - 1) / pageSize
	if pageQuantity == 0 {
		pageQuantity = 1
	}
	return &CreditPaymentList{
		Items:        payments[start:end],
		PageNumber:   page,
		PageQuantity: pageQuantity,
	}, nil
}

func (uc *CreditUseCase) GetClientRating(clientID uuid.UUID) (*CreditRating, error) {
	credits, _, err := uc.creditRepo.ListByClientID(clientID, 1000, 0)
	if err != nil {
		return nil, err
	}
	totalOverdueAmount := 0.0
	totalOverdueCount := 0
	for _, c := range credits {
		ov, _ := uc.GetOverdue(c.ID)
		if ov != nil {
			totalOverdueAmount += ov.OverdueAmount
			totalOverdueCount += ov.OverduePayments
		}
	}
	score := 100
	score -= totalOverdueCount * 10
	if totalOverdueAmount > 0 {
		score -= int(totalOverdueAmount / 1000)
	}
	if score < 0 {
		score = 0
	}
	risk := "низкий"
	if score < 40 {
		risk = "высокий"
	} else if score < 70 {
		risk = "средний"
	}
	return &CreditRating{
		ClientID:      clientID,
		Score:         score,
		RiskLevel:     risk,
		OverdueAmount: round2(totalOverdueAmount),
		OverdueCount:  totalOverdueCount,
	}, nil
}

func round2(v float64) float64 {
	return math.Round(v*100) / 100
}
