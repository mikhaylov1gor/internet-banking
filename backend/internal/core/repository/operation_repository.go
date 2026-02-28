package repository

import (
	"internet-bank/internal/core/entity"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type OperationRepository interface {
	Create(op *entity.Operation) error
	ListByAccountID(accountID uuid.UUID, limit, offset int) ([]*entity.Operation, error)
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

func (r *operationRepo) ListByAccountID(accountID uuid.UUID, limit, offset int) ([]*entity.Operation, error) {
	var list []*entity.Operation
	err := r.db.Where("account_id = ?", accountID).
		Order("created_at DESC").
		Limit(limit).Offset(offset).
		Find(&list).Error
	return list, err
}
