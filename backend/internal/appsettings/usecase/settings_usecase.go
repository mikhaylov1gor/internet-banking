package usecase

import (
	"encoding/json"
	"errors"
	"time"

	"internet-bank/internal/appsettings/entity"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrInvalidAppType = errors.New("неверный тип приложения")
	ErrInvalidTheme   = errors.New("неверная тема")
)

type SettingsRepository interface {
	GetByUserAndApp(userID uuid.UUID, appType entity.AppType) (*entity.AppSettings, error)
	Save(s *entity.AppSettings) error
}

type SettingsDTO struct {
	AppType          string   `json:"app_type"`
	Theme            string   `json:"theme"`
	HiddenAccountIDs []string `json:"hidden_account_ids"`
}

type SettingsUseCase struct {
	repo SettingsRepository
}

func NewSettingsUseCase(repo SettingsRepository) *SettingsUseCase {
	return &SettingsUseCase{repo: repo}
}

func (uc *SettingsUseCase) Get(userID uuid.UUID, appType string) (*SettingsDTO, error) {
	at, err := parseAppType(appType)
	if err != nil {
		return nil, err
	}
	s, err := uc.repo.GetByUserAndApp(userID, at)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		ids := make([]string, 0)
		raw, _ := json.Marshal(ids)
		now := time.Now()
		s = &entity.AppSettings{
			ID:               uuid.New(),
			UserID:           userID,
			AppType:          at,
			Theme:            entity.ThemeLight,
			HiddenAccountIDs: string(raw),
			CreatedAt:        now,
			UpdatedAt:        now,
		}
		if err := uc.repo.Save(s); err != nil {
			return nil, err
		}
	} else if err != nil {
		return nil, err
	}
	var hidden []string
	_ = json.Unmarshal([]byte(s.HiddenAccountIDs), &hidden)
	return &SettingsDTO{
		AppType:          string(s.AppType),
		Theme:            string(s.Theme),
		HiddenAccountIDs: hidden,
	}, nil
}

func (uc *SettingsUseCase) Upsert(userID uuid.UUID, appType, theme string, hiddenAccountIDs []string) (*SettingsDTO, error) {
	at, err := parseAppType(appType)
	if err != nil {
		return nil, err
	}
	th, err := parseTheme(theme)
	if err != nil {
		return nil, err
	}
	s, err := uc.repo.GetByUserAndApp(userID, at)
	now := time.Now()
	if errors.Is(err, gorm.ErrRecordNotFound) {
		s = &entity.AppSettings{
			ID:        uuid.New(),
			UserID:    userID,
			AppType:   at,
			CreatedAt: now,
		}
	} else if err != nil {
		return nil, err
	}
	raw, _ := json.Marshal(hiddenAccountIDs)
	s.Theme = th
	s.HiddenAccountIDs = string(raw)
	s.UpdatedAt = now
	if err := uc.repo.Save(s); err != nil {
		return nil, err
	}
	return &SettingsDTO{
		AppType:          string(s.AppType),
		Theme:            string(s.Theme),
		HiddenAccountIDs: hiddenAccountIDs,
	}, nil
}

func parseAppType(v string) (entity.AppType, error) {
	switch entity.AppType(v) {
	case entity.AppTypeClient, entity.AppTypeEmployee:
		return entity.AppType(v), nil
	default:
		return "", ErrInvalidAppType
	}
}

func parseTheme(v string) (entity.Theme, error) {
	switch entity.Theme(v) {
	case entity.ThemeLight, entity.ThemeDark:
		return entity.Theme(v), nil
	default:
		return "", ErrInvalidTheme
	}
}
