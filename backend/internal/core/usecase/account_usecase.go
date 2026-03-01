package usecase

import (
	"errors"
	"time"

	"internet-bank/internal/core/entity"

	"github.com/google/uuid"
)

var (
	ErrAccountNotFound   = errors.New("счёт не найден")
	ErrAccountClosed     = errors.New("счёт закрыт")
	ErrInsufficientFunds = errors.New("недостаточно средств")
	ErrInvalidAmount     = errors.New("сумма должна быть положительной")
)

type AccountRepository interface {
	Create(acc *entity.Account) error
	GetByID(id uuid.UUID) (*entity.Account, error)
	List(clientID *uuid.UUID, status *entity.AccountStatus, limit, offset int) ([]*entity.Account, int64, error)
	Update(acc *entity.Account) error
}

type OperationRepository interface {
	Create(op *entity.Operation) error
	ListByAccountID(accountID uuid.UUID, limit, offset int) ([]*entity.Operation, int64, error)
}

type AccountUseCase struct {
	accRepo AccountRepository
	opRepo  OperationRepository
}

func NewAccountUseCase(accRepo AccountRepository, opRepo OperationRepository) *AccountUseCase {
	return &AccountUseCase{accRepo: accRepo, opRepo: opRepo}
}

func (uc *AccountUseCase) OpenAccount(clientID uuid.UUID) (*entity.Account, error) {
	acc := &entity.Account{
		ID:       uuid.New(),
		ClientID: clientID,
		Balance:  0,
		Currency: entity.CurrencyRUB,
		Status:   entity.AccountStatusActive,
		OpenedAt: time.Now(),
	}
	if err := uc.accRepo.Create(acc); err != nil {
		return nil, err
	}
	return acc, nil
}

func (uc *AccountUseCase) GetByID(id uuid.UUID) (*entity.Account, error) {
	return uc.accRepo.GetByID(id)
}

func (uc *AccountUseCase) List(clientID *uuid.UUID, status *entity.AccountStatus, limit, offset int) ([]*entity.Account, int64, error) {
	return uc.accRepo.List(clientID, status, limit, offset)
}

func (uc *AccountUseCase) CloseAccount(accountID, clientID uuid.UUID) error {
	acc, err := uc.accRepo.GetByID(accountID)
	if err != nil {
		return ErrAccountNotFound
	}
	if acc.Status == entity.AccountStatusClosed {
		return ErrAccountClosed
	}
	if acc.ClientID != clientID {
		return errors.New("закрыть счёт может только владелец")
	}
	if acc.Balance != 0 {
		return errors.New("для закрытия счёта баланс должен быть равен нулю")
	}
	now := time.Now()
	acc.ClosedAt = &now
	acc.Status = entity.AccountStatusClosed
	return uc.accRepo.Update(acc)
}

func (uc *AccountUseCase) Deposit(accountID uuid.UUID, amount float64, description string) (*entity.Operation, error) {
	if amount < 0.01 {
		return nil, ErrInvalidAmount
	}
	acc, err := uc.accRepo.GetByID(accountID)
	if err != nil {
		return nil, ErrAccountNotFound
	}
	if acc.Status != entity.AccountStatusActive {
		return nil, ErrAccountClosed
	}
	acc.Balance += amount
	if err := uc.accRepo.Update(acc); err != nil {
		return nil, err
	}
	op := &entity.Operation{
		ID:           uuid.New(),
		AccountID:    accountID,
		Type:         entity.OpDeposit,
		Amount:       amount,
		BalanceAfter: acc.Balance,
		Description:  description,
		CreatedAt:    time.Now(),
	}
	if err := uc.opRepo.Create(op); err != nil {
		return nil, err
	}
	return op, nil
}

func (uc *AccountUseCase) Withdraw(accountID uuid.UUID, amount float64, description string) (*entity.Operation, error) {
	if amount < 0.01 {
		return nil, ErrInvalidAmount
	}
	acc, err := uc.accRepo.GetByID(accountID)
	if err != nil {
		return nil, ErrAccountNotFound
	}
	if acc.Status != entity.AccountStatusActive {
		return nil, ErrAccountClosed
	}
	if acc.Balance < amount {
		return nil, ErrInsufficientFunds
	}
	acc.Balance -= amount
	if err := uc.accRepo.Update(acc); err != nil {
		return nil, err
	}
	op := &entity.Operation{
		ID:           uuid.New(),
		AccountID:    accountID,
		Type:         entity.OpWithdraw,
		Amount:       amount,
		BalanceAfter: acc.Balance,
		Description:  description,
		CreatedAt:    time.Now(),
	}
	if err := uc.opRepo.Create(op); err != nil {
		return nil, err
	}
	return op, nil
}

func (uc *AccountUseCase) ListOperations(accountID uuid.UUID, limit, offset int) ([]*entity.Operation, int64, error) {
	if limit <= 0 {
		limit = 50
	}
	return uc.opRepo.ListByAccountID(accountID, limit, offset)
}
