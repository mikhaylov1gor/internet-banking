package repository

import (
	"internet-bank/internal/appsettings/entity"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SettingsRepository interface {
	GetByUserAndApp(userID uuid.UUID, appType entity.AppType) (*entity.AppSettings, error)
	Save(s *entity.AppSettings) error
}

type settingsRepo struct {
	db *gorm.DB
}

func NewSettingsRepository(db *gorm.DB) SettingsRepository {
	return &settingsRepo{db: db}
}

func (r *settingsRepo) GetByUserAndApp(userID uuid.UUID, appType entity.AppType) (*entity.AppSettings, error) {
	var s entity.AppSettings
	err := r.db.Where("user_id = ? AND app_type = ?", userID, appType).First(&s).Error
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *settingsRepo) Save(s *entity.AppSettings) error {
	return r.db.Save(s).Error
}
