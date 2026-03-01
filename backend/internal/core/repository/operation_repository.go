package repository

import (
	"internet-bank/internal/core/entity"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type OperationRepository interface {
	Create(op *entity.Operation) error
	ListByAccountID(accountID uuid.UUID, limit, offset int) ([]*entity.Operation, int64, error)
}

type operationRepo struct {
	db *gorm.DB
}

func NewOperationRepository(db *gorm.DB) OperationRepository {
	return &operationRepo{db: db}
}

func (r *operationRepo) Create(op *entity.Operation) error {
	return r.db.Create(op).Error
}

func (r *operationRepo) ListByAccountID(accountID uuid.UUID, limit, offset int) ([]*entity.Operation, int64, error) {
	var list []*entity.Operation
	var total int64
	// Получить общее количество
	if err := r.db.Where("account_id = ?", accountID).Model(&entity.Operation{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	// Получить данные с пагинацией
	err := r.db.Where("account_id = ?", accountID).
		Order("created_at DESC").
		Limit(limit).Offset(offset).
		Find(&list).Error
	return list, total, err
}
