package bootstrap

import (
	"fmt"
	"log"
	"time"

	"internet-bank/internal/core/entity"
	"internet-bank/pkg/bankconstants"
	"internet-bank/pkg/config"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func EnsureMasterAccount(db *gorm.DB, cfg config.CoreConfig) error {
	id, err := uuid.Parse(cfg.MasterAccountID)
	if err != nil {
		return fmt.Errorf("MASTER_ACCOUNT_ID: %w", err)
	}
	bankUID, err := uuid.Parse(cfg.BankServiceUserID)
	if err != nil {
		return fmt.Errorf("BANK_SERVICE_USER_ID: %w", err)
	}
	var n int64
	if err := db.Model(&entity.Account{}).Where("id = ?", id).Count(&n).Error; err != nil {
		return err
	}
	if n > 0 {
		var existing entity.Account
		if err := db.Where("id = ?", id).First(&existing).Error; err != nil {
			return err
		}
		log.Printf("master account ok: id=%s balance=%.2f %s", id.String(), existing.Balance, existing.Currency)
		return nil
	}
	cur := entity.Currency(cfg.MasterCurrency)
	if cur != entity.CurrencyRUB && cur != entity.CurrencyUSD && cur != entity.CurrencyEUR {
		cur = entity.CurrencyRUB
	}
	acc := &entity.Account{
		ID:            id,
		AccountNumber: bankconstants.MasterAccountNumber,
		ClientID:      bankUID,
		Balance:       cfg.MasterInitialBalance,
		Currency:      cur,
		Status:        entity.AccountStatusActive,
		OpenedAt:      time.Now(),
	}
	if err := db.Create(acc).Error; err != nil {
		return fmt.Errorf("master account seed: %w", err)
	}
	log.Printf("master account created: id=%s number=%s balance=%.2f %s", id.String(), bankconstants.MasterAccountNumber, acc.Balance, cur)
	return nil
}
