package repository

import (
	"errors"

	"internet-bank/internal/users/entity"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DeviceTokenRepository interface {
	Upsert(t *entity.DevicePushToken) error
	ListTokensByUserID(userID uuid.UUID) ([]string, error)
	ListTokensByRole(role string) ([]string, error)
}

type deviceTokenRepo struct {
	db *gorm.DB
}

func NewDeviceTokenRepository(db *gorm.DB) DeviceTokenRepository {
	return &deviceTokenRepo{db: db}
}

func (r *deviceTokenRepo) Upsert(t *entity.DevicePushToken) error {
	var existing entity.DevicePushToken
	err := r.db.Where("user_id = ? AND token = ?", t.UserID, t.Token).First(&existing).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return r.db.Create(t).Error
	}
	if err != nil {
		return err
	}
	existing.Role = t.Role
	existing.Platform = t.Platform
	return r.db.Save(&existing).Error
}

func (r *deviceTokenRepo) ListTokensByUserID(userID uuid.UUID) ([]string, error) {
	var tokens []string
	err := r.db.Model(&entity.DevicePushToken{}).
		Where("user_id = ?", userID).
		Pluck("token", &tokens).Error
	return tokens, err
}

func (r *deviceTokenRepo) ListTokensByRole(role string) ([]string, error) {
	var tokens []string
	err := r.db.Model(&entity.DevicePushToken{}).
		Where("role = ?", role).
		Pluck("token", &tokens).Error
	return tokens, err
}
