package repository

import (
	"internet-bank/internal/credits/entity"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CreditRepository interface {
	Create(c *entity.Credit) error
	GetByID(id uuid.UUID) (*entity.Credit, error)
	ListByClientID(clientID uuid.UUID, limit, offset int) ([]*entity.Credit, error)
	Update(c *entity.Credit) error
	Delete(id uuid.UUID) error
	AccrueInterest() error
}

type creditRepo struct {
	db *gorm.DB
}

func NewCreditRepository(db *gorm.DB) CreditRepository {
	return &creditRepo{db: db}
}

func (r *creditRepo) Create(c *entity.Credit) error {
	return r.db.Create(c).Error
}

func (r *creditRepo) GetByID(id uuid.UUID) (*entity.Credit, error) {
	var c entity.Credit
	err := r.db.Where("id = ?", id).First(&c).Error
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *creditRepo) ListByClientID(clientID uuid.UUID, limit, offset int) ([]*entity.Credit, error) {
	if limit <= 0 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}
	var list []*entity.Credit
	err := r.db.Where("client_id = ?", clientID).Order("issued_at DESC").Offset(offset).Limit(limit).Find(&list).Error
	return list, err
}

func (r *creditRepo) Update(c *entity.Credit) error {
	return r.db.Save(c).Error
}

func (r *creditRepo) Delete(id uuid.UUID) error {
	return r.db.Delete(&entity.Credit{}, "id = ?", id).Error
}

func (r *creditRepo) AccrueInterest() error {
	return r.db.Model(&entity.Credit{}).
		Where("status = ?", entity.CreditStatusActive).
		Update("remaining", gorm.Expr("remaining * (1 + rate / 525600)")).Error
}
