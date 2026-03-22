package bootstrap

import (
	"errors"
	"fmt"
	"log"
	"time"

	"internet-bank/internal/core/entity"
	"internet-bank/pkg/config"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

const masterAccountNumber = "9999999999999999"

func EnsureMasterAccount(db *gorm.DB, cfg config.CoreConfig) error {
	id, err := uuid.Parse(cfg.MasterAccountID)
	if err != nil {
		return fmt.Errorf("MASTER_ACCOUNT_ID: %w", err)
	}
	bankUID, err := uuid.Parse(cfg.BankServiceUserID)
	if err != nil {
		return fmt.Errorf("BANK_SERVICE_USER_ID: %w", err)
	}
	var existing entity.Account
	err = db.Where("id = ?", id).First(&existing).Error
	if err == nil {
		log.Printf("master account ok: id=%s balance=%.2f %s", id.String(), existing.Balance, existing.Currency)
		return nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}
	cur := entity.Currency(cfg.MasterCurrency)
	if cur != entity.CurrencyRUB && cur != entity.CurrencyUSD && cur != entity.CurrencyEUR {
		cur = entity.CurrencyRUB
	}
	acc := &entity.Account{
		ID:            id,
		AccountNumber: masterAccountNumber,
		ClientID:      bankUID,
		Balance:       cfg.MasterInitialBalance,
		Currency:      cur,
		Status:        entity.AccountStatusActive,
		OpenedAt:      time.Now(),
	}
	if err := db.Create(acc).Error; err != nil {
		return fmt.Errorf("master account seed: %w", err)
	}
	log.Printf("master account created: id=%s number=%s balance=%.2f %s", id.String(), masterAccountNumber, acc.Balance, cur)
	return nil
}
