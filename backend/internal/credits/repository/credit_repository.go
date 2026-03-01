package repository

import (
	"internet-bank/internal/credits/entity"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CreditRepository interface {
	Create(c *entity.Credit) error
	GetByID(id uuid.UUID) (*entity.Credit, error)
	ListByClientID(clientID uuid.UUID, limit, offset int) ([]*entity.Credit, int64, error)
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

func (r *creditRepo) ListByClientID(clientID uuid.UUID, limit, offset int) ([]*entity.Credit, int64, error) {
	if limit <= 0 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}
	var list []*entity.Credit
	var total int64
	q := r.db.Where("client_id = ?", clientID)
	if err := q.Model(&entity.Credit{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := q.Order("issued_at DESC").Offset(offset).Limit(limit).Find(&list).Error
	return list, total, err
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
