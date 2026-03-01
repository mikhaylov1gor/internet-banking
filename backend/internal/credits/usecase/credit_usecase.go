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
	tariffRepo TariffRepository
	creditRepo CreditRepository
	coreClient client.CoreClient
}

func NewCreditUseCase(tariffRepo TariffRepository, creditRepo CreditRepository, coreClient client.CoreClient) *CreditUseCase {
	return &CreditUseCase{tariffRepo: tariffRepo, creditRepo: creditRepo, coreClient: coreClient}
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
		if err := uc.coreClient.Deposit(accountID, amount, bearerToken); err != nil {
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
		if err := uc.coreClient.Withdraw(accountID, toRepay, bearerToken); err != nil {
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
