package usecase

import (
	"crypto/rand"
	"errors"
	"fmt"
	"math"
	"math/big"
	"time"

	"internet-bank/internal/core/client"
	"internet-bank/internal/core/entity"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrAccountNotFound   = errors.New("счёт не найден")
	ErrAccountClosed     = errors.New("счёт закрыт")
	ErrInsufficientFunds = errors.New("недостаточно средств")
	ErrInvalidAmount     = errors.New("сумма должна быть положительной")
	ErrInvalidCurrency   = errors.New("неверная валюта")
)

type AccountRepository interface {
	Create(acc *entity.Account) error
	GetByID(id uuid.UUID) (*entity.Account, error)
	GetByNumber(accountNumber string) (*entity.Account, error)
	List(clientID *uuid.UUID, status *entity.AccountStatus, limit, offset int) ([]*entity.Account, int64, error)
	Update(acc *entity.Account) error
	DebitIfSufficient(accountID uuid.UUID, amount float64) (*entity.Account, error)
	TransferAtomic(fromAccountID, toAccountID uuid.UUID, debitAmount, creditAmount float64) (*entity.Account, *entity.Account, error)
}

type OperationRepository interface {
	Create(op *entity.Operation) error
	ListByAccountID(accountID uuid.UUID, limit, offset int) ([]*entity.Operation, int64, error)
}

type OperationProducer interface {
	Publish(op *entity.Operation) error
}

type AccountUseCase struct {
	accRepo    AccountRepository
	opRepo     OperationRepository
	fxProvider client.FXRateProvider
	producer   OperationProducer
}

type TransferQuote struct {
	FromAccountID   uuid.UUID       `json:"from_account_id"`
	ToAccountID     uuid.UUID       `json:"to_account_id"`
	ToAccountNumber string          `json:"to_account_number,omitempty"`
	FromCurrency    entity.Currency `json:"from_currency"`
	ToCurrency      entity.Currency `json:"to_currency"`
	DebitAmount     float64         `json:"debit_amount"`
	CreditAmount    float64         `json:"credit_amount"`
	Rate            float64         `json:"rate"`
}

func NewAccountUseCase(accRepo AccountRepository, opRepo OperationRepository, fxProvider client.FXRateProvider, producer OperationProducer) *AccountUseCase {
	return &AccountUseCase{accRepo: accRepo, opRepo: opRepo, fxProvider: fxProvider, producer: producer}
}

func (uc *AccountUseCase) OpenAccount(clientID uuid.UUID, currency entity.Currency) (*entity.Account, error) {
	if currency != entity.CurrencyRUB && currency != entity.CurrencyUSD && currency != entity.CurrencyEUR {
		return nil, ErrInvalidCurrency
	}
	number, err := generateAccountNumber()
	if err != nil {
		return nil, err
	}
	acc := &entity.Account{
		ID:            uuid.New(),
		AccountNumber: number,
		ClientID:      clientID,
		Balance:       0,
		Currency:      currency,
		Status:        entity.AccountStatusActive,
		OpenedAt:      time.Now(),
	}
	if err := uc.accRepo.Create(acc); err != nil {
		return nil, err
	}
	return acc, nil
}

func (uc *AccountUseCase) GetByID(id uuid.UUID) (*entity.Account, error) {
	return uc.accRepo.GetByID(id)
}

func (uc *AccountUseCase) GetByNumber(accountNumber string) (*entity.Account, error) {
	return uc.accRepo.GetByNumber(accountNumber)
}

func (uc *AccountUseCase) List(clientID *uuid.UUID, status *entity.AccountStatus, limit, offset int) ([]*entity.Account, int64, error) {
	return uc.accRepo.List(clientID, status, limit, offset)
}

func (uc *AccountUseCase) Transfer(fromAccountID, toAccountID uuid.UUID, amount float64, description string) (*entity.Operation, *entity.Operation, error) {
	if amount < 0.01 {
		return nil, nil, ErrInvalidAmount
	}
	if fromAccountID == toAccountID {
		return nil, nil, errors.New("счета отправителя и получателя должны отличаться")
	}
	fromAcc, err := uc.accRepo.GetByID(fromAccountID)
	if err != nil {
		return nil, nil, ErrAccountNotFound
	}
	toAcc, err := uc.accRepo.GetByID(toAccountID)
	if err != nil {
		return nil, nil, ErrAccountNotFound
	}
	if fromAcc.Status != entity.AccountStatusActive || toAcc.Status != entity.AccountStatusActive {
		return nil, nil, ErrAccountClosed
	}
	if fromAcc.Balance < amount {
		return nil, nil, ErrInsufficientFunds
	}
	quote, err := uc.buildTransferQuote(fromAcc, toAcc, amount)
	if err != nil {
		return nil, nil, err
	}
	fromAcc, toAcc, err = uc.accRepo.TransferAtomic(fromAccountID, toAccountID, amount, quote.CreditAmount)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, ErrInsufficientFunds
		}
		return nil, nil, err
	}
	outOp := &entity.Operation{
		ID:           uuid.New(),
		AccountID:    fromAcc.ID,
		Type:         entity.OpWithdraw,
		Amount:       amount,
		BalanceAfter: fromAcc.Balance,
		Description:  description,
		CreatedAt:    time.Now(),
	}
	inOp := &entity.Operation{
		ID:           uuid.New(),
		AccountID:    toAcc.ID,
		Type:         entity.OpDeposit,
		Amount:       quote.CreditAmount,
		BalanceAfter: toAcc.Balance,
		Description:  description,
		CreatedAt:    time.Now(),
	}
	if err := uc.publishOperation(outOp); err != nil {
		return nil, nil, err
	}
	if err := uc.publishOperation(inOp); err != nil {
		return nil, nil, err
	}
	return outOp, inOp, nil
}

func (uc *AccountUseCase) PreviewTransfer(fromAccountID, toAccountID uuid.UUID, amount float64) (*TransferQuote, error) {
	if amount < 0.01 {
		return nil, ErrInvalidAmount
	}
	fromAcc, err := uc.accRepo.GetByID(fromAccountID)
	if err != nil {
		return nil, ErrAccountNotFound
	}
	toAcc, err := uc.accRepo.GetByID(toAccountID)
	if err != nil {
		return nil, ErrAccountNotFound
	}
	if fromAcc.Status != entity.AccountStatusActive || toAcc.Status != entity.AccountStatusActive {
		return nil, ErrAccountClosed
	}
	return uc.buildTransferQuote(fromAcc, toAcc, amount)
}

func (uc *AccountUseCase) buildTransferQuote(fromAcc, toAcc *entity.Account, amount float64) (*TransferQuote, error) {
	creditAmount := amount
	rate := 1.0
	if fromAcc.Currency != toAcc.Currency {
		if uc.fxProvider == nil {
			return nil, errors.New("провайдер курсов валют не настроен")
		}
		r, err := uc.fxProvider.Rate(fromAcc.Currency, toAcc.Currency)
		if err != nil {
			return nil, err
		}
		rate = r
		creditAmount = roundMoney(amount * rate)
		if creditAmount < 0.01 {
			return nil, errors.New("сумма после конвертации меньше минимально допустимой")
		}
	}
	return &TransferQuote{
		FromAccountID:   fromAcc.ID,
		ToAccountID:     toAcc.ID,
		ToAccountNumber: toAcc.AccountNumber,
		FromCurrency:    fromAcc.Currency,
		ToCurrency:      toAcc.Currency,
		DebitAmount:     roundMoney(amount),
		CreditAmount:    creditAmount,
		Rate:            rate,
	}, nil
}

func roundMoney(v float64) float64 {
	return math.Round(v*100) / 100
}

func generateAccountNumber() (string, error) {
	const length = 16
	digits := make([]byte, length)
	for i := 0; i < length; i++ {
		n, err := rand.Int(rand.Reader, big.NewInt(10))
		if err != nil {
			return "", err
		}
		digits[i] = byte('0' + n.Int64())
	}
	digits[0] = byte('1' + digits[0]%9)
	return fmt.Sprintf("%s", digits), nil
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
	if err := uc.publishOperation(op); err != nil {
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
	acc, err = uc.accRepo.DebitIfSufficient(accountID, amount)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInsufficientFunds
		}
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
	if err := uc.publishOperation(op); err != nil {
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

func (uc *AccountUseCase) publishOperation(op *entity.Operation) error {
	if uc.producer != nil {
		if err := uc.producer.Publish(op); err == nil {
			return nil
		}
	}
	return uc.opRepo.Create(op)
}
