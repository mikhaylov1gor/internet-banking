package repository

import (
	"internet-bank/internal/credits/entity"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TariffRepository interface {
	Create(t *entity.CreditTariff) error
	GetByID(id uuid.UUID) (*entity.CreditTariff, error)
	List(limit, offset int) ([]*entity.CreditTariff, int64, error)
}

type tariffRepo struct {
	db *gorm.DB
}

func NewTariffRepository(db *gorm.DB) TariffRepository {
	return &tariffRepo{db: db}
}

func (r *tariffRepo) Create(t *entity.CreditTariff) error {
	return r.db.Create(t).Error
}

func (r *tariffRepo) GetByID(id uuid.UUID) (*entity.CreditTariff, error) {
	var t entity.CreditTariff
	err := r.db.Where("id = ?", id).First(&t).Error
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *tariffRepo) List(limit, offset int) ([]*entity.CreditTariff, int64, error) {
	if limit <= 0 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}
	var list []*entity.CreditTariff
	var total int64
	if err := r.db.Model(&entity.CreditTariff{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := r.db.Order("created_at DESC").Offset(offset).Limit(limit).Find(&list).Error
	return list, total, err
}
