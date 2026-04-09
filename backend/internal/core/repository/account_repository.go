package repository

import (
	"internet-bank/internal/core/entity"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
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

type accountRepo struct {
	db *gorm.DB
}

func NewAccountRepository(db *gorm.DB) AccountRepository {
	return &accountRepo{db: db}
}

func (r *accountRepo) Create(acc *entity.Account) error {
	return r.db.Create(acc).Error
}

func (r *accountRepo) GetByID(id uuid.UUID) (*entity.Account, error) {
	var acc entity.Account
	err := r.db.Where("id = ?", id).First(&acc).Error
	if err != nil {
		return nil, err
	}
	return &acc, nil
}

func (r *accountRepo) GetByNumber(accountNumber string) (*entity.Account, error) {
	var acc entity.Account
	err := r.db.Where("account_number = ?", accountNumber).First(&acc).Error
	if err != nil {
		return nil, err
	}
	return &acc, nil
}

func (r *accountRepo) List(clientID *uuid.UUID, status *entity.AccountStatus, limit, offset int) ([]*entity.Account, int64, error) {
	if limit <= 0 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}
	var list []*entity.Account
	var total int64
	q := r.db.Model(&entity.Account{})
	if clientID != nil {
		q = q.Where("client_id = ?", *clientID)
	}
	if status != nil {
		q = q.Where("status = ?", *status)
	}
	// Получить общее количество
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	// Получить данные с пагинацией
	err := q.Order("opened_at DESC").Offset(offset).Limit(limit).Find(&list).Error
	return list, total, err
}

func (r *accountRepo) Update(acc *entity.Account) error {
	return r.db.Save(acc).Error
}

func (r *accountRepo) DebitIfSufficient(accountID uuid.UUID, amount float64) (*entity.Account, error) {
	tx := r.db.Model(&entity.Account{}).
		Where("id = ? AND status = ? AND balance >= ?", accountID, entity.AccountStatusActive, amount).
		Update("balance", gorm.Expr("balance - ?", amount))
	if tx.Error != nil {
		return nil, tx.Error
	}
	if tx.RowsAffected == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	return r.GetByID(accountID)
}

func (r *accountRepo) TransferAtomic(fromAccountID, toAccountID uuid.UUID, debitAmount, creditAmount float64) (*entity.Account, *entity.Account, error) {
	var fromAcc entity.Account
	var toAcc entity.Account
	err := r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ?", fromAccountID).First(&fromAcc).Error; err != nil {
			return err
		}
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ?", toAccountID).First(&toAcc).Error; err != nil {
			return err
		}
		if fromAcc.Status != entity.AccountStatusActive || toAcc.Status != entity.AccountStatusActive {
			return gorm.ErrInvalidData
		}
		if fromAcc.Balance < debitAmount {
			return gorm.ErrRecordNotFound
		}
		if err := tx.Model(&entity.Account{}).Where("id = ?", fromAccountID).
			Update("balance", gorm.Expr("balance - ?", debitAmount)).Error; err != nil {
			return err
		}
		if err := tx.Model(&entity.Account{}).Where("id = ?", toAccountID).
			Update("balance", gorm.Expr("balance + ?", creditAmount)).Error; err != nil {
			return err
		}
		if err := tx.Where("id = ?", fromAccountID).First(&fromAcc).Error; err != nil {
			return err
		}
		if err := tx.Where("id = ?", toAccountID).First(&toAcc).Error; err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, nil, err
	}
	return &fromAcc, &toAcc, nil
}
