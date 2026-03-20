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
	ErrCreditNotFound   = errors.New("кредит не найден")
	ErrAmountOutOfRange = errors.New("сумма вне диапазона тарифа")
	ErrCreditNotActive  = errors.New("кредит не активен")
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
	tariffRepo        TariffRepository
	creditRepo        CreditRepository
	coreClient        client.CoreClient
	masterAccountID   uuid.UUID
	internalAuthToken string
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

func NewCreditUseCase(tariffRepo TariffRepository, creditRepo CreditRepository, coreClient client.CoreClient, masterAccountID uuid.UUID, internalAuthToken string) *CreditUseCase {
	return &CreditUseCase{
		tariffRepo:        tariffRepo,
		creditRepo:        creditRepo,
		coreClient:        coreClient,
		masterAccountID:   masterAccountID,
		internalAuthToken: internalAuthToken,
	}
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
		accInfo, err := uc.coreClient.GetAccount(accountID, uc.internalAuthToken)
		if err != nil {
			return nil, errors.New("счёт не найден")
		}
		if accInfo.ClientID != clientID {
			return nil, errors.New("счёт не принадлежит клиенту")
		}
		if accInfo.Status != "active" {
			return nil, errors.New("счёт закрыт или заблокирован")
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
	if uc.coreClient != nil {
		if err := uc.coreClient.Transfer(uc.masterAccountID, accountID, amount, uc.internalAuthToken); err != nil {
			_ = uc.creditRepo.Update(c)
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
		return nil, errors.New("сумма погашения не менее 0.01")
	}
	c, err := uc.creditRepo.GetByID(creditID)
	if err != nil {
		return nil, ErrCreditNotFound
	}
	if c.Status != entity.CreditStatusActive {
		return nil, ErrCreditNotActive
	}
	// Получить информацию о счете
	accInfo, err := uc.coreClient.GetAccount(accountID, bearerToken)
	if err != nil {
		return nil, errors.New("счёт не найден")
	}
	// Проверить принадлежность счета пользователю
	if accInfo.ClientID != userID {
		return nil, errors.New("счёт не принадлежит пользователю")
	}
	// Проверить статус счета (не закрыт)
	if accInfo.Status != "active" {
		return nil, errors.New("счёт закрыт или заблокирован")
	}
	// Проверить наличие денег
	if accInfo.Balance < amount {
		return nil, errors.New("недостаточно средств на счёте")
	}
	toRepay := math.Min(amount, c.Remaining)
	if uc.coreClient != nil {
		if err := uc.coreClient.Transfer(accountID, uc.masterAccountID, toRepay, uc.internalAuthToken); err != nil {
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
