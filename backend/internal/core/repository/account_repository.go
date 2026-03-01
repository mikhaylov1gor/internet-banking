package repository

import (
	"internet-bank/internal/core/entity"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AccountRepository interface {
	Create(acc *entity.Account) error
	GetByID(id uuid.UUID) (*entity.Account, error)
	List(clientID *uuid.UUID, status *entity.AccountStatus, limit, offset int) ([]*entity.Account, int64, error)
	Update(acc *entity.Account) error
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
