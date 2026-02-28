package usecase

import (
	"errors"

	"internet-bank/internal/credits/entity"

	"github.com/google/uuid"
)

var ErrTariffNotFound = errors.New("тариф не найден")

type TariffRepository interface {
	Create(t *entity.CreditTariff) error
	GetByID(id uuid.UUID) (*entity.CreditTariff, error)
	List(limit, offset int) ([]*entity.CreditTariff, error)
}

type TariffUseCase struct {
	repo TariffRepository
}

func NewTariffUseCase(repo TariffRepository) *TariffUseCase {
	return &TariffUseCase{repo: repo}
}

func (uc *TariffUseCase) Create(name string, rate, minAmount, maxAmount float64) (*entity.CreditTariff, error) {
	t := &entity.CreditTariff{
		ID:        uuid.New(),
		Name:      name,
		Rate:      rate,
		MinAmount: minAmount,
		MaxAmount: maxAmount,
	}
	if err := uc.repo.Create(t); err != nil {
		return nil, err
	}
	return t, nil
}

func (uc *TariffUseCase) GetByID(id uuid.UUID) (*entity.CreditTariff, error) {
	return uc.repo.GetByID(id)
}

func (uc *TariffUseCase) List(limit, offset int) ([]*entity.CreditTariff, error) {
	return uc.repo.List(limit, offset)
}
