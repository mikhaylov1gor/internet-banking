package usecase

import (
	"errors"
	"math"
	"time"

	"internet-bank/internal/credits/client"
	"internet-bank/internal/credits/entity"

	"github.com/google/uuid"
)

var (
	ErrCreditNotFound      = errors.New("кредит не найден")
	ErrAmountOutOfRange    = errors.New("сумма вне диапазона тарифа")
	ErrCreditNotActive     = errors.New("кредит не активен")
	ErrInvalidTerm         = errors.New("укажите term_days и/или term_months (срок кредита)")
	ErrTermTooLong         = errors.New("максимальный срок кредита 3650 дней (~10 лет)")
	ErrAccountWrongClient  = errors.New("счёт не принадлежит клиенту")
	ErrAccountNotOwned     = errors.New("счёт не принадлежит пользователю")
	ErrAccountInactive     = errors.New("счёт закрыт или заблокирован")
	ErrRepayAmountTooSmall = errors.New("сумма погашения не менее 0.01")
	ErrInsufficientFunds   = errors.New("недостаточно средств на счёте")
	ErrInternalToken       = errors.New("внутренний токен не настроен")
	ErrCreditPreviewAmount = errors.New("сумма для проверки не менее 0.01")
)

type CreditRepository interface {
	Create(c *entity.Credit) error
	GetByID(id uuid.UUID) (*entity.Credit, error)
	ListByClientID(clientID uuid.UUID, limit, offset int) ([]*entity.Credit, int64, error)
	ListActive() ([]*entity.Credit, error)
	Update(c *entity.Credit) error
	Delete(id uuid.UUID) error
	AccrueInterest() error
}

type CreditUseCase struct {
	tariffRepo      TariffRepository
	creditRepo      CreditRepository
	coreClient      client.CoreClient
	masterAccountID uuid.UUID
	internalTokenFn func() (string, error)
}

type CreditOverdue struct {
	CreditID         uuid.UUID `json:"credit_id"`
	ClientID         uuid.UUID `json:"client_id"`
	ExpectedPaid     float64   `json:"expected_paid"`
	ActualPaid       float64   `json:"actual_paid"`
	OverdueAmount    float64   `json:"overdue_amount"`
	OverduePayments  int       `json:"overdue_payments"`
	DailyInstallment float64   `json:"daily_installment"`
	MinutePayment    float64   `json:"minute_payment,omitempty"`
}

type CreditRating struct {
	ClientID      uuid.UUID `json:"client_id"`
	Score         int       `json:"score"`
	RiskLevel     string    `json:"risk_level"`
	OverdueAmount float64   `json:"overdue_amount"`
	OverdueCount  int       `json:"overdue_count"`
}

type CreditPayment struct {
	Day             int       `json:"day"`
	Index           int       `json:"index"`
	DueAt           time.Time `json:"due_at"`
	AmountDue       float64   `json:"amount_due"`
	AmountPaid      float64   `json:"amount_paid"`
	AmountRemaining float64   `json:"amount_remaining"`
	ExpectedTotal   float64   `json:"expected_total"`
	PaidNowTotal    float64   `json:"paid_now_total"`
	Status          string    `json:"status"`
}

type CreditPaymentList struct {
	Items        []CreditPayment `json:"items"`
	PageNumber   int             `json:"pageNumber"`
	PageQuantity int             `json:"pageQuantity"`
}

// CreditAvailability — хватит ли средств на мастер-счёте для выдачи тела кредита (перевод клиенту).
type CreditAvailability struct {
	Allowed         bool    `json:"allowed"`
	RequestedAmount float64 `json:"requested_amount"`
	MasterBalance   float64 `json:"master_balance"`
	MasterCurrency  string  `json:"master_currency"`
	Shortfall       float64 `json:"shortfall,omitempty"`
}

type AutoRepayResult struct {
	CheckedCredits   int
	ChargedCredits   int
	SkippedCredits   int
	FailedCredits    int
	TotalRepayAmount float64
}

func NewCreditUseCase(
	tariffRepo TariffRepository,
	creditRepo CreditRepository,
	coreClient client.CoreClient,
	masterAccountID uuid.UUID,
	internalTokenFn func() (string, error),
) *CreditUseCase {
	return &CreditUseCase{
		tariffRepo:      tariffRepo,
		creditRepo:      creditRepo,
		coreClient:      coreClient,
		masterAccountID: masterAccountID,
		internalTokenFn: internalTokenFn,
	}
}

func (uc *CreditUseCase) getInternalToken() (string, error) {
	if uc.internalTokenFn == nil {
		return "", ErrInternalToken
	}
	return uc.internalTokenFn()
}

func dailyPayment(amount, annualRate float64) float64 {
	return amount * (annualRate / 365)
}

func resolveTermDays(termDays, termMonths *int) (int, error) {
	td, tm := 0, 0
	if termDays != nil {
		td = *termDays
	}
	if termMonths != nil {
		tm = *termMonths
	}
	if td < 0 || tm < 0 {
		return 0, ErrInvalidTerm
	}
	if td == 0 && tm == 0 {
		return 0, ErrInvalidTerm
	}
	n := td + tm*30
	if n < 1 {
		return 0, ErrInvalidTerm
	}
	if n > 3650 {
		return 0, ErrTermTooLong
	}
	return n, nil
}

func totalDueSimplePrincipal(principal, annualRate float64, termDays int) float64 {
	interest := principal * annualRate * (float64(termDays) / 365.0)
	return principal + interest
}

func calendarBase(t time.Time) time.Time {
	return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, t.Location())
}

func actualPaidTowardSchedule(c *entity.Credit) float64 {
	if c.TotalDue > 0.01 {
		return c.TotalDue - c.Remaining
	}
	return c.Amount - c.Remaining
}

func (uc *CreditUseCase) Issue(clientID, accountID, tariffID uuid.UUID, amount float64, termDaysIn, termMonthsIn *int, bearerToken string) (*entity.Credit, error) {
	tariff, err := uc.tariffRepo.GetByID(tariffID)
	if err != nil {
		return nil, ErrTariffNotFound
	}
	if amount < tariff.MinAmount || amount > tariff.MaxAmount {
		return nil, ErrAmountOutOfRange
	}
	termDays, err := resolveTermDays(termDaysIn, termMonthsIn)
	if err != nil {
		return nil, err
	}
	totalDue := totalDueSimplePrincipal(amount, tariff.Rate, termDays)
	dailyInst := totalDue / float64(termDays)
	if uc.coreClient != nil {
		internalToken, err := uc.getInternalToken()
		if err != nil {
			return nil, err
		}
		accInfo, err := uc.coreClient.GetAccount(accountID, internalToken)
		if err != nil {
			return nil, err
		}
		if accInfo.ClientID != clientID {
			return nil, ErrAccountWrongClient
		}
		if accInfo.Status != "active" {
			return nil, ErrAccountInactive
		}
	}
	now := time.Now()
	c := &entity.Credit{
		ID:           uuid.New(),
		ClientID:     clientID,
		AccountID:    accountID,
		TariffID:     tariffID,
		Amount:       amount,
		Rate:         tariff.Rate,
		TermDays:     termDays,
		TotalDue:     totalDue,
		DailyPayment: dailyInst,
		Remaining:    totalDue,
		IssuedAt:     now,
		Status:       entity.CreditStatusActive,
	}
	if err := uc.creditRepo.Create(c); err != nil {
		return nil, err
	}
	rollbackCredit := func() { _ = uc.creditRepo.Delete(c.ID) }
	if uc.coreClient != nil {
		internalToken, err := uc.getInternalToken()
		if err != nil {
			rollbackCredit()
			return nil, err
		}
		if err := uc.coreClient.Transfer(uc.masterAccountID, accountID, amount, internalToken); err != nil {
			rollbackCredit()
			return nil, err
		}
	}
	return c, nil
}

// CheckCreditAvailability проверяет, достаточно ли средств на мастер-счёте для выдачи суммы кредита (тело займа).
func (uc *CreditUseCase) CheckCreditAvailability(amount float64) (*CreditAvailability, error) {
	if amount < 0.01 {
		return nil, ErrCreditPreviewAmount
	}
	if uc.coreClient == nil {
		return nil, errors.New("сервис счетов недоступен")
	}
	internalToken, err := uc.getInternalToken()
	if err != nil {
		return nil, err
	}
	acc, err := uc.coreClient.GetAccount(uc.masterAccountID, internalToken)
	if err != nil {
		return nil, err
	}
	allowed := acc.Balance+1e-9 >= amount
	out := &CreditAvailability{
		Allowed:         allowed,
		RequestedAmount: round2(amount),
		MasterBalance:   round2(acc.Balance),
		MasterCurrency:  acc.Currency,
	}
	if !allowed {
		s := amount - acc.Balance
		if s > 0 {
			out.Shortfall = round2(s)
		}
	}
	return out, nil
}

func (uc *CreditUseCase) GetByID(id uuid.UUID) (*entity.Credit, error) {
	return uc.creditRepo.GetByID(id)
}

func (uc *CreditUseCase) ListByClientID(clientID uuid.UUID, limit, offset int) ([]*entity.Credit, int64, error) {
	return uc.creditRepo.ListByClientID(clientID, limit, offset)
}

func (uc *CreditUseCase) Repay(creditID uuid.UUID, accountID uuid.UUID, amount float64, userID uuid.UUID, bearerToken string) (*entity.Credit, error) {
	if amount < 0.01 {
		return nil, ErrRepayAmountTooSmall
	}
	c, err := uc.creditRepo.GetByID(creditID)
	if err != nil {
		return nil, ErrCreditNotFound
	}
	if c.Status != entity.CreditStatusActive {
		return nil, ErrCreditNotActive
	}
	accInfo, err := uc.coreClient.GetAccount(accountID, bearerToken)
	if err != nil {
		return nil, err
	}
	if accInfo.ClientID != userID {
		return nil, ErrAccountNotOwned
	}
	if accInfo.Status != "active" {
		return nil, ErrAccountInactive
	}
	toRepay := math.Min(amount, c.Remaining)
	debitAmount := toRepay
	appliedRepay := toRepay
	if uc.coreClient != nil {
		internalToken, err := uc.getInternalToken()
		if err != nil {
			return nil, err
		}
		// Всегда рассчитываем списание через preview в Core:
		// amount в repay трактуется как сумма к зачислению в мастер-счёт (валюта кредита),
		// а debitAmount — сколько нужно списать с выбранного счёта (с конвертацией при необходимости).
		debitAmount, appliedRepay, err = uc.resolveDebitForTargetCredit(accountID, uc.masterAccountID, toRepay, internalToken)
		if err != nil {
			return nil, err
		}
		if appliedRepay > c.Remaining {
			appliedRepay = c.Remaining
		}
		if accInfo.Balance < debitAmount {
			return nil, ErrInsufficientFunds
		}
		if err := uc.coreClient.Transfer(accountID, uc.masterAccountID, debitAmount, internalToken); err != nil {
			return nil, err
		}
	} else if accInfo.Balance < debitAmount {
		return nil, ErrInsufficientFunds
	}
	c.Remaining -= appliedRepay
	if c.Remaining <= 0 || c.Remaining < 0.01 {
		c.Remaining = 0
		c.Status = entity.CreditStatusPaid
		if err := uc.creditRepo.Delete(creditID); err != nil {
			return nil, err
		}
		return c, nil
	}
	if err := uc.creditRepo.Update(c); err != nil {
		return nil, err
	}
	return c, nil
}

// resolveDebitForTargetCredit подбирает минимальную сумму списания (в валюте счёта fromAccountID),
// чтобы после конвертации в toAccountID зачислилась targetCredit (или чуть больше из-за округления).
func (uc *CreditUseCase) resolveDebitForTargetCredit(fromAccountID, toAccountID uuid.UUID, targetCredit float64, bearerToken string) (debitAmount float64, creditAmount float64, err error) {
	targetCredit = round2(targetCredit)
	if targetCredit < 0.01 {
		return 0, 0, ErrRepayAmountTooSmall
	}
	highCents := int64(math.Ceil(targetCredit * 100))
	if highCents < 1 {
		highCents = 1
	}
	// Сначала расширяем верхнюю границу.
	var quote *client.TransferQuote
	for i := 0; i < 24; i++ {
		amt := float64(highCents) / 100.0
		quote, err = uc.coreClient.PreviewTransfer(fromAccountID, toAccountID, amt, bearerToken)
		if err != nil {
			return 0, 0, err
		}
		if quote.CreditAmount+1e-6 >= targetCredit {
			break
		}
		highCents *= 2
	}
	if quote == nil || quote.CreditAmount+1e-6 < targetCredit {
		return 0, 0, ErrInsufficientFunds
	}

	lowCents := int64(1)
	for lowCents < highCents {
		mid := (lowCents + highCents) / 2
		midAmt := float64(mid) / 100.0
		midQuote, qErr := uc.coreClient.PreviewTransfer(fromAccountID, toAccountID, midAmt, bearerToken)
		if qErr != nil {
			return 0, 0, qErr
		}
		if midQuote.CreditAmount+1e-6 >= targetCredit {
			highCents = mid
			quote = midQuote
		} else {
			lowCents = mid + 1
		}
	}
	// Финальная проверка для найденной суммы.
	finalAmt := float64(lowCents) / 100.0
	finalQuote, qErr := uc.coreClient.PreviewTransfer(fromAccountID, toAccountID, finalAmt, bearerToken)
	if qErr != nil {
		return 0, 0, qErr
	}
	return round2(finalAmt), round2(finalQuote.CreditAmount), nil
}

func (uc *CreditUseCase) AccrueInterest() error {
	return uc.creditRepo.AccrueInterest()
}

// RunDailyAutoRepay запускает автосписание по активным кредитам на сумму обязательных платежей к текущей дате.
func (uc *CreditUseCase) RunDailyAutoRepay() (*AutoRepayResult, error) {
	result := &AutoRepayResult{}
	credits, err := uc.creditRepo.ListActive()
	if err != nil {
		return nil, err
	}
	result.CheckedCredits = len(credits)
	if len(credits) == 0 {
		return result, nil
	}
	internalToken, err := uc.getInternalToken()
	if err != nil {
		return nil, err
	}
	for _, c := range credits {
		if c == nil || c.TermDays <= 0 {
			result.SkippedCredits++
			continue
		}
		od, odErr := uc.getOverdueDaily(c)
		if odErr != nil {
			result.FailedCredits++
			continue
		}
		toRepay := round2(od.OverdueAmount)
		if toRepay < 0.01 {
			result.SkippedCredits++
			continue
		}
		if _, repErr := uc.Repay(c.ID, c.AccountID, toRepay, c.ClientID, internalToken); repErr != nil {
			if errors.Is(repErr, ErrInsufficientFunds) || errors.Is(repErr, ErrAccountInactive) {
				result.SkippedCredits++
				continue
			}
			result.FailedCredits++
			continue
		}
		result.ChargedCredits++
		result.TotalRepayAmount = round2(result.TotalRepayAmount + toRepay)
	}
	return result, nil
}

func (uc *CreditUseCase) GetOverdue(creditID uuid.UUID) (*CreditOverdue, error) {
	c, err := uc.creditRepo.GetByID(creditID)
	if err != nil {
		return nil, ErrCreditNotFound
	}
	if c.TermDays > 0 {
		return uc.getOverdueDaily(c)
	}
	return uc.getOverdueLegacy(c)
}

func (uc *CreditUseCase) getOverdueDaily(c *entity.Credit) (*CreditOverdue, error) {
	now := time.Now()
	base := calendarBase(c.IssuedAt)
	nowDay := calendarBase(now)
	elapsed := int(nowDay.Sub(base).Hours() / 24)
	if elapsed < 0 {
		elapsed = 0
	}
	if elapsed > c.TermDays {
		elapsed = c.TermDays
	}
	daily := c.DailyPayment
	if c.TermDays > 0 && daily < 1e-9 {
		daily = c.TotalDue / float64(c.TermDays)
	}
	expectedPaid := math.Min(c.TotalDue, float64(elapsed)*daily)
	actualPaid := actualPaidTowardSchedule(c)
	overdueAmount := expectedPaid - actualPaid
	if overdueAmount < 0 {
		overdueAmount = 0
	}
	overduePayments := 0
	if daily > 1e-9 && overdueAmount > 0 {
		overduePayments = int(math.Ceil(overdueAmount / daily))
	}
	return &CreditOverdue{
		CreditID:         c.ID,
		ClientID:         c.ClientID,
		ExpectedPaid:     round2(expectedPaid),
		ActualPaid:       round2(actualPaid),
		OverdueAmount:    round2(overdueAmount),
		OverduePayments:  overduePayments,
		DailyInstallment: round2(daily),
		MinutePayment:    0,
	}, nil
}

func (uc *CreditUseCase) getOverdueLegacy(c *entity.Credit) (*CreditOverdue, error) {
	elapsedMinutes := int(time.Since(c.IssuedAt).Minutes())
	if elapsedMinutes < 0 {
		elapsedMinutes = 0
	}
	minutePayment := c.DailyPayment / 1440
	if minutePayment < 0.01 {
		minutePayment = 0.01
	}
	expectedPaid := math.Min(c.Amount, float64(elapsedMinutes)*minutePayment)
	actualPaid := c.Amount - c.Remaining
	overdueAmount := expectedPaid - actualPaid
	if overdueAmount < 0 {
		overdueAmount = 0
	}
	overduePayments := 0
	if overdueAmount > 0 {
		overduePayments = int(math.Ceil(overdueAmount / minutePayment))
	}
	return &CreditOverdue{
		CreditID:         c.ID,
		ClientID:         c.ClientID,
		ExpectedPaid:     round2(expectedPaid),
		ActualPaid:       round2(actualPaid),
		OverdueAmount:    round2(overdueAmount),
		OverduePayments:  overduePayments,
		DailyInstallment: 0,
		MinutePayment:    round2(minutePayment),
	}, nil
}

func (uc *CreditUseCase) GetPayments(creditID uuid.UUID, page, pageSize int, onlyOverdue bool) (*CreditPaymentList, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 50
	}
	c, err := uc.creditRepo.GetByID(creditID)
	if err != nil {
		return nil, ErrCreditNotFound
	}
	if c.TermDays > 0 {
		return uc.getPaymentsDaily(c, page, pageSize, onlyOverdue)
	}
	return uc.getPaymentsLegacy(c, page, pageSize, onlyOverdue)
}

func (uc *CreditUseCase) getPaymentsDaily(c *entity.Credit, page, pageSize int, onlyOverdue bool) (*CreditPaymentList, error) {
	now := time.Now()
	actualPaid := actualPaidTowardSchedule(c)
	perDay := c.DailyPayment
	if c.TermDays > 0 && perDay < 1e-9 {
		perDay = c.TotalDue / float64(c.TermDays)
	}
	base := calendarBase(c.IssuedAt)
	payments := make([]CreditPayment, 0, c.TermDays)
	var cumBefore float64
	for i := 1; i <= c.TermDays; i++ {
		var tranche float64
		if i == c.TermDays {
			tranche = round2(c.TotalDue - float64(i-1)*perDay)
		} else {
			tranche = perDay
		}
		var expectedCum float64
		if i == c.TermDays {
			expectedCum = c.TotalDue
		} else {
			expectedCum = math.Min(c.TotalDue, float64(i)*perDay)
		}
		dueAt := base.AddDate(0, 0, i)
		// FIFO: внесённые средства закрывают график с начала (первые дни целиком, затем часть следующего).
		paidToward := math.Min(tranche, math.Max(0, actualPaid-cumBefore))
		remaining := tranche - paidToward
		cumBefore += tranche

		var status string
		switch {
		case remaining <= 1e-6:
			status = "paid"
		case paidToward > 1e-6:
			status = "partial"
		case !dueAt.After(now):
			status = "overdue"
		default:
			status = "pending"
		}
		if onlyOverdue && (dueAt.After(now) || remaining <= 1e-6) {
			continue
		}
		payments = append(payments, CreditPayment{
			Day:             i,
			Index:           i,
			DueAt:           dueAt,
			AmountDue:       round2(tranche),
			AmountPaid:      round2(paidToward),
			AmountRemaining: round2(remaining),
			ExpectedTotal:   round2(expectedCum),
			PaidNowTotal:    round2(actualPaid),
			Status:          status,
		})
	}
	return paginatePayments(payments, page, pageSize), nil
}

func (uc *CreditUseCase) getPaymentsLegacy(c *entity.Credit, page, pageSize int, onlyOverdue bool) (*CreditPaymentList, error) {
	now := time.Now()
	elapsedMinutes := int(now.Sub(c.IssuedAt).Minutes())
	if elapsedMinutes < 0 {
		elapsedMinutes = 0
	}
	minutePayment := c.DailyPayment / 1440
	if minutePayment < 0.01 {
		minutePayment = 0.01
	}
	totalPayments := int(math.Ceil(c.Amount / minutePayment))
	if totalPayments < 1 {
		totalPayments = 1
	}
	actualPaid := c.Amount - c.Remaining
	payments := make([]CreditPayment, 0, totalPayments)
	var cumBefore float64
	for i := 1; i <= totalPayments; i++ {
		var expectedPrev float64
		if i > 1 {
			expectedPrev = math.Min(c.Amount, float64(i-1)*minutePayment)
		}
		expected := math.Min(c.Amount, float64(i)*minutePayment)
		tranche := expected - expectedPrev
		dueAt := c.IssuedAt.Add(time.Duration(i) * time.Minute)
		paidToward := math.Min(tranche, math.Max(0, actualPaid-cumBefore))
		remaining := tranche - paidToward
		cumBefore += tranche

		var status string
		switch {
		case remaining <= 1e-6:
			status = "paid"
		case paidToward > 1e-6:
			status = "partial"
		case dueAt.Before(now) || dueAt.Equal(now):
			status = "overdue"
		default:
			status = "pending"
		}
		if onlyOverdue && (dueAt.After(now) || remaining <= 1e-6) {
			continue
		}
		payments = append(payments, CreditPayment{
			Day:             i,
			Index:           i,
			DueAt:           dueAt,
			AmountDue:       round2(tranche),
			AmountPaid:      round2(paidToward),
			AmountRemaining: round2(remaining),
			ExpectedTotal:   round2(expected),
			PaidNowTotal:    round2(actualPaid),
			Status:          status,
		})
	}
	return paginatePayments(payments, page, pageSize), nil
}

func paginatePayments(payments []CreditPayment, page, pageSize int) *CreditPaymentList {
	total := len(payments)
	start := (page - 1) * pageSize
	if start > total {
		start = total
	}
	end := start + pageSize
	if end > total {
		end = total
	}
	pageQuantity := (total + pageSize - 1) / pageSize
	if pageQuantity == 0 {
		pageQuantity = 1
	}
	return &CreditPaymentList{
		Items:        payments[start:end],
		PageNumber:   page,
		PageQuantity: pageQuantity,
	}
}

func (uc *CreditUseCase) GetClientRating(clientID uuid.UUID) (*CreditRating, error) {
	credits, _, err := uc.creditRepo.ListByClientID(clientID, 1000, 0)
	if err != nil {
		return nil, err
	}
	totalOverdueAmount := 0.0
	totalOverdueCount := 0
	for _, c := range credits {
		ov, _ := uc.GetOverdue(c.ID)
		if ov != nil {
			totalOverdueAmount += ov.OverdueAmount
			totalOverdueCount += ov.OverduePayments
		}
	}
	score := 100
	score -= totalOverdueCount * 10
	if totalOverdueAmount > 0 {
		score -= int(totalOverdueAmount / 1000)
	}
	if score < 0 {
		score = 0
	}
	risk := "низкий"
	if score < 40 {
		risk = "высокий"
	} else if score < 70 {
		risk = "средний"
	}
	return &CreditRating{
		ClientID:      clientID,
		Score:         score,
		RiskLevel:     risk,
		OverdueAmount: round2(totalOverdueAmount),
		OverdueCount:  totalOverdueCount,
	}, nil
}

func round2(v float64) float64 {
	return math.Round(v*100) / 100
}
