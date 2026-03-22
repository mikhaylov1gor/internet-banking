import React from 'react'
import { Button } from '@shared/ui/button'
import { Input } from '@shared/ui/input'
import { Select } from '@shared/ui/select'
import { Spinner } from '@shared/ui/spinner'
import { ErrorFallback } from '@shared/ui/error-fallback'
import { Modal } from '@shared/ui/modal'
import { CopyableId } from '@shared/ui/copyable-id'
import { getApiErrorMessage, getLoadDataErrorMessage, isNotFoundError } from '@shared/api'
import { formatAccountNumberMasked, digitsOnlyAccountNumber } from '@shared/utils/account-number'
import { formatShortId } from '@shared/utils/format-short-id'
import { RubDepositPreview } from '@shared/ui/rub-deposit-preview'
import {
  useCreditDetailPage,
  getCreditInstallmentDueAmount,
  parseRepayAmountInput,
} from '../model/use-credit-detail-page'
import './style.css'

const formatMoney = (n: number) =>
  n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const formatCreditIssueDay = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })

const formatPaymentDueDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

const paymentStatusLabel = (status: string) => {
  switch (status) {
    case 'paid':
      return 'Внесено'
    case 'partial':
      return 'Частично'
    case 'overdue':
      return 'Просрочено'
    case 'pending':
    default:
      return 'Ожидает'
  }
}

export const CreditDetailPage = () => {
  const {
    credit,
    linkedAccount,
    creditLoading,
    creditError,
    accounts,
    accountsLoadError,
    showRepayModal,
    setShowRepayModal,
    repayAmount,
    setRepayAmount,
    selectedAccount,
    setSelectedAccount,
    repayCreditMutation,
    handleRepay,
    navigate,
    creditPayments,
    creditPaymentsLoading,
    creditPaymentsError,
    paymentsPage,
    setPaymentsPage,
    paymentsPageQuantity,
    onlyOverduePayments,
    setOnlyOverduePayments,
    paymentsEnabled,
    paymentToPay,
    setPaymentToPay,
    payInstallmentAccountId,
    setPayInstallmentAccountId,
    closePayInstallmentModal,
    handlePayInstallment,
    repayPreviewPlan,
    repaySelectedCurrency,
    repayTransferPreviewQuery,
    repayFxQuoteActive,
    repayFxQuoteQuery,
    installmentPreviewPlan,
    installmentSelectedCurrency,
    installmentTransferPreviewQuery,
    installmentFxQuoteActive,
    installmentFxQuoteQuery,
    repayFundsStatus,
    installmentFundsStatus,
  } = useCreditDetailPage()

  const payInstallmentAmount =
    credit && paymentToPay ? getCreditInstallmentDueAmount(credit, paymentToPay) : 0

  if (creditLoading) {
    return (
      <div className="credit-detail-page-loading">
        <Spinner size="large" />
      </div>
    )
  }

  if (creditError && isNotFoundError(creditError)) {
    return (
      <ErrorFallback
        title="Кредит не найден"
        message="Кредит с указанным ID не существует или был удалён"
        onGoBack={() => navigate('/credits')}
      />
    )
  }

  if (creditError || !credit) {
    return (
      <ErrorFallback
        title="Ошибка загрузки"
        message={getLoadDataErrorMessage('данные кредита')}
        onGoBack={() => navigate('/credits')}
      />
    )
  }

  return (
    <div className="credit-detail-page-container">
      <Button variant="secondary" onClick={() => navigate('/credits')} className="credit-detail-page-back-button">
        ← Назад
      </Button>

      <div className="credit-detail-page-credit-info">
        <h1 className="credit-detail-page-title">
          <span className="credit-detail-page-title-gradient">Кредит</span>
          <CopyableId
            className="credit-detail-page-title-gradient credit-detail-page-title-id"
            copyText={credit.id}
            toastOk="Номер кредита скопирован"
            title="Скопировать полный номер кредита"
          >
            {` #${credit.id.slice(0, 8)}…`}
          </CopyableId>
        </h1>
        <div className="credit-detail-page-details">
          <div className="credit-detail-page-detail-item">
            <span className="credit-detail-page-label">Сумма:</span>
            <span className="credit-detail-page-amount">
              {credit.amount.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₽
            </span>
          </div>
          {(credit.term_days ?? 0) > 0 && (credit.total_due ?? 0) > 0 && (
            <div className="credit-detail-page-detail-item">
              <span className="credit-detail-page-label">К возврату с процентами:</span>
              <span>{formatMoney(Number(credit.total_due))} ₽</span>
            </div>
          )}
          {(credit.status === 'active' || credit.status === 'overdue') && (
            <div className="credit-detail-page-detail-item">
              <span className="credit-detail-page-label">Остаток:</span>
              <span className="credit-detail-page-remaining">{formatMoney(Number(credit.remaining))} ₽</span>
            </div>
          )}
          <div className="credit-detail-page-detail-item">
            <span className="credit-detail-page-label">Процентная ставка:</span>
            <span>{(credit.rate * 100).toFixed(2)}%</span>
          </div>
          <div className="credit-detail-page-detail-item">
            <span className="credit-detail-page-label">Статус:</span>
            <span
              className={
                credit.status === 'active'
                  ? 'credit-detail-page-active'
                  : credit.status === 'overdue'
                    ? 'credit-detail-page-overdue'
                    : 'credit-detail-page-paid'
              }
            >
              {credit.status === 'active' ? 'Активен' : credit.status === 'overdue' ? 'Просрочен' : 'Погашен'}
            </span>
          </div>
          <div className="credit-detail-page-detail-item credit-detail-page-detail-item--issue-dates">
            <span className="credit-detail-page-label">Даты выдачи</span>
            <p className="credit-detail-page-issue-range">
              {credit.maturity_at
                ? `С ${formatCreditIssueDay(credit.issued_at)} до ${formatCreditIssueDay(credit.maturity_at)}`
                : `С ${formatCreditIssueDay(credit.issued_at)}`}
            </p>
          </div>
          <div className="credit-detail-page-detail-item credit-detail-page-detail-item--row">
            <span className="credit-detail-page-label">Счёт:</span>
            <span className="credit-detail-page-account-value">
              <CopyableId
                className="credit-detail-page-id-copy"
                copyText={
                  linkedAccount
                    ? digitsOnlyAccountNumber(linkedAccount.account_number)
                    : credit.account_id
                }
                toastOk="Номер счёта скопирован"
                title="Скопировать номер счёта"
              >
                {linkedAccount
                  ? ` ${formatAccountNumberMasked(linkedAccount.account_number)}`
                  : ` #${formatShortId(credit.account_id)}`}
              </CopyableId>
              <button
                type="button"
                className="credit-detail-page-account-open"
                onClick={() =>
                  navigate(`/accounts/${credit.account_id}`, {
                    state: { fromCredit: true, creditId: credit.id },
                  })
                }
              >
                Открыть
              </button>
            </span>
          </div>
          {credit.paid_at && (
            <div className="credit-detail-page-detail-item">
              <span className="credit-detail-page-label">Погашен:</span>
              <span>{new Date(credit.paid_at).toLocaleDateString('ru-RU')}</span>
            </div>
          )}
        </div>

        {(credit.status === 'active' || credit.status === 'overdue') && (
          <div className="actions">
            <Button onClick={() => setShowRepayModal(true)}>Погасить кредит</Button>
          </div>
        )}
      </div>

      {paymentsEnabled && (
        <section className="credit-detail-payments-section" aria-labelledby="credit-payments-heading">
          <div className="credit-detail-payments-head">
            <h2 id="credit-payments-heading" className="credit-detail-payments-title">
              Платежи
            </h2>
            <label className="credit-detail-payments-filter">
              <input
                type="checkbox"
                checked={onlyOverduePayments}
                onChange={(e) => setOnlyOverduePayments(e.target.checked)}
              />
              <span>Только просроченные</span>
            </label>
          </div>
          {creditPaymentsError && (
            <div className="error" role="alert">
              {getLoadDataErrorMessage('платежи по кредиту')}
            </div>
          )}
          {creditPaymentsLoading && (
            <div className="credit-detail-payments-loading">
              <Spinner />
            </div>
          )}
          {!creditPaymentsLoading && !creditPaymentsError && creditPayments && (
            <>
              {creditPayments.items.length === 0 ? (
                <p className="credit-detail-payments-empty">Нет платежей для отображения.</p>
              ) : (
                <ul className="credit-payments-feed" role="list">
                  {creditPayments.items.map((row) => {
                    const installmentDue = getCreditInstallmentDueAmount(credit, row)
                    const canPayInstallment = installmentDue >= 0.01 && row.status !== 'paid'
                    const dueLabel = formatPaymentDueDate(row.due_at)
                    const dayLabel = row.day != null ? `День ${row.day}` : `Платёж ${row.index}`
                    const scheduleLine =
                      row.amount_due != null ? (
                        <>
                          К оплате за день: {formatMoney(row.amount_due)} ₽
                          {row.amount_paid != null && row.amount_paid > 0 && (
                            <> · внесено {formatMoney(row.amount_paid)} ₽</>
                          )}
                          {row.amount_remaining != null && row.amount_remaining > 0 && (
                            <> · осталось {formatMoney(row.amount_remaining)} ₽</>
                          )}
                        </>
                      ) : (
                        <>Накопительно по графику: {formatMoney(row.expected_total)} ₽</>
                      )
                    return (
                      <li key={`${row.index}-${row.due_at}`} className="credit-payments-feed-item">
                        <div
                          className={`credit-payments-feed-icon credit-payments-feed-icon--${row.status}`}
                          aria-hidden
                        />
                        <div className="credit-payments-feed-content">
                          <div className="credit-payments-feed-top">
                            <div className="credit-payments-feed-text">
                              <div className="credit-payments-feed-title">{dayLabel}</div>
                              <time dateTime={row.due_at} className="credit-payments-feed-date">
                                {dueLabel}
                              </time>
                              <p className="credit-payments-feed-schedule-line">{scheduleLine}</p>
                            </div>
                            <div className="credit-payments-feed-sumcol">
                              <span className="credit-payments-feed-amount">
                                Всего к этому дню: {formatMoney(row.expected_total)} ₽
                              </span>
                              <span
                                className={`credit-payments-feed-badge credit-payments-feed-badge--${row.status}`}
                              >
                                {paymentStatusLabel(row.status)}
                              </span>
                            </div>
                          </div>
                          {canPayInstallment ? (
                            <div className="credit-payments-feed-action">
                              <Button
                                type="button"
                                variant="primary"
                                size="small"
                                className="credit-payments-feed-pay-btn"
                                onClick={() => {
                                  setPaymentToPay(row)
                                  setPayInstallmentAccountId('')
                                }}
                              >
                                Оплатить
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
              {paymentsPageQuantity > 1 && (
                <div className="credit-detail-payments-pagination">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={paymentsPage <= 1}
                    onClick={() => setPaymentsPage((p) => Math.max(1, p - 1))}
                  >
                    Назад
                  </Button>
                  <span className="credit-detail-payments-page-info">
                    Страница {paymentsPage} из {paymentsPageQuantity}
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={paymentsPage >= paymentsPageQuantity}
                    onClick={() => setPaymentsPage((p) => p + 1)}
                  >
                    Вперёд
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      )}

      <Modal isOpen={showRepayModal} onClose={() => {
        setShowRepayModal(false)
        setRepayAmount('')
        setSelectedAccount('')
      }} title="Погасить кредит">
        <div className="repay-form">
          {accountsLoadError && (
            <div className="error" style={{ marginBottom: '12px' }}>
              {getLoadDataErrorMessage('счета')}
            </div>
          )}
          <Select
            label="Счет для погашения"
            value={selectedAccount}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedAccount(e.target.value)}
            options={
              accountsLoadError
                ? [{ value: '', label: '—' }]
                : accounts
                  ? [
                      { value: '', label: 'Выберите счет' },
                      ...accounts.map((account) => {
                        const masked = formatAccountNumberMasked(account.account_number)
                        const bal = account.balance.toLocaleString('ru-RU', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                        const cur = account.currency || 'RUB'
                        const withBalance = `Счёт ${masked} (баланс: ${bal} ${cur})`
                        return {
                          value: account.id,
                          label: withBalance,
                          listLabel: withBalance,
                        }
                      }),
                    ]
                  : [{ value: '', label: 'Загрузка счетов...' }]
            }
          />
          <Input
            label="Сумма погашения"
            type="number"
            min="0"
            step="0.01"
            max={credit.remaining > 1 ? credit.remaining : 1}
            value={repayAmount}
            suffix="₽"
            inputMode="decimal"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const value = e.target.value
              const numValue = parseRepayAmountInput(value)
              const maxRepay = credit.remaining > 1 ? credit.remaining : 1
              if (value === '' || (Number.isFinite(numValue) && numValue >= 0 && numValue <= maxRepay)) {
                setRepayAmount(value)
              }
            }}
            placeholder={
              credit.remaining > 0 ? `до ${formatMoney(Number(credit.remaining))}` : 'Кредит уже погашен'
            }
            disabled={credit.remaining <= 0}
          />
        {credit.remaining <= 0 && (
            <div className="error" style={{ marginTop: '10px' }}>
              Невозможно погасить кредит: остаток долга меньше или равен нулю
            </div>
        )}
        {repayAmount &&
          parseRepayAmountInput(repayAmount) > credit.remaining &&
          credit.remaining > 0 && (
            <div className="error" style={{ marginTop: '10px' }}>
              Сумма погашения не может превышать остаток долга ({formatMoney(Number(credit.remaining))} ₽)
            </div>
          )}
          {selectedAccount &&
            repayAmount &&
            repayFundsStatus === 'insufficient' && (
              <div className="error" style={{ marginTop: '10px' }}>
                Недостаточно средств на выбранном счёте.
              </div>
            )}
          {selectedAccount &&
            repayAmount &&
            (repaySelectedCurrency === 'USD' || repaySelectedCurrency === 'EUR') &&
            repayFundsStatus === 'preview_unavailable' && (
              <div className="error" style={{ marginTop: '10px' }} role="alert">
                {getApiErrorMessage(
                  repayFxQuoteQuery.error,
                  'Не удалось оценить сумму списания. Попробуйте позже.'
                )}
              </div>
            )}
          <RubDepositPreview
            variant="debit"
            plan={repayPreviewPlan}
            selectedAccountCurrency={repaySelectedCurrency}
            preview={repayTransferPreviewQuery}
            fxQuoteActive={repayFxQuoteActive}
            fxQuote={{
              isPending: repayFxQuoteQuery.isPending,
              isFetching: repayFxQuoteQuery.isFetching,
              isError: repayFxQuoteQuery.isError,
              isSuccess: repayFxQuoteQuery.isSuccess,
              error: repayFxQuoteQuery.error,
              data: repayFxQuoteQuery.data,
            }}
          />
          {repayCreditMutation.isError && (
            <div className="error">
              {repayCreditMutation.error instanceof Error
                ? repayCreditMutation.error.message
                : 'Ошибка погашения кредита'}
            </div>
          )}
          <div className="modalActions">
            <Button variant="secondary" onClick={() => {
              setShowRepayModal(false)
              setRepayAmount('')
              setSelectedAccount('')
            }}>
              Отмена
            </Button>
            <Button
              onClick={handleRepay}
              disabled={
                repayCreditMutation.isPending ||
                !repayAmount ||
                !selectedAccount ||
                parseRepayAmountInput(repayAmount) <= 0 ||
                parseRepayAmountInput(repayAmount) > credit.remaining ||
                repayFundsStatus !== 'sufficient'
              }
            >
              {repayCreditMutation.isPending ? 'Погашение...' : 'Погасить'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!paymentToPay}
        onClose={() => {
          if (!repayCreditMutation.isPending) closePayInstallmentModal()
        }}
        title={
          paymentToPay
            ? `Оплатить платёж (${formatCreditIssueDay(paymentToPay.due_at)})`
            : 'Оплатить платёж'
        }
      >
        {paymentToPay && (
          <div className="repay-form">
            <div className="credit-detail-pay-installment-sum">
              <span className="credit-detail-pay-installment-sum-label">Сумма платежа</span>
              <span className="credit-detail-pay-installment-sum-value" aria-live="polite">
                {formatMoney(payInstallmentAmount)} ₽
              </span>
            </div>
            {payInstallmentAmount < 0.01 && (
              <div className="error" role="alert">
                По этому платежу нечего оплачивать (уже внесено или сумма округлилась до нуля).
              </div>
            )}
            {accountsLoadError && (
              <div className="error" style={{ marginBottom: '12px' }}>
                {getLoadDataErrorMessage('счета')}
              </div>
            )}
            <Select
              label="Счёт для списания"
              value={payInstallmentAccountId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setPayInstallmentAccountId(e.target.value)
              }
              options={
                accountsLoadError
                  ? [{ value: '', label: '—' }]
                  : accounts
                    ? [
                        { value: '', label: 'Выберите счёт' },
                        ...accounts.map((account) => {
                          const masked = formatAccountNumberMasked(account.account_number)
                          const bal = account.balance.toLocaleString('ru-RU', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                          const cur = account.currency || 'RUB'
                          const withBalance = `Счёт ${masked} (баланс: ${bal} ${cur})`
                          return {
                            value: account.id,
                            label: withBalance,
                            listLabel: withBalance,
                          }
                        }),
                      ]
                    : [{ value: '', label: 'Загрузка счетов...' }]
              }
            />
            {payInstallmentAccountId &&
              payInstallmentAmount >= 0.01 &&
              installmentFundsStatus === 'insufficient' && (
                <div className="error" style={{ marginTop: '10px' }}>
                  Недостаточно средств на выбранном счёте.
                </div>
              )}
            {payInstallmentAccountId &&
              payInstallmentAmount >= 0.01 &&
              (installmentSelectedCurrency === 'USD' || installmentSelectedCurrency === 'EUR') &&
              installmentFundsStatus === 'preview_unavailable' && (
                <div className="error" style={{ marginTop: '10px' }} role="alert">
                  {getApiErrorMessage(
                    installmentFxQuoteQuery.error,
                    'Не удалось оценить сумму списания. Попробуйте позже.'
                  )}
                </div>
              )}
            <RubDepositPreview
              variant="debit"
              plan={installmentPreviewPlan}
              selectedAccountCurrency={installmentSelectedCurrency}
              preview={installmentTransferPreviewQuery}
              fxQuoteActive={installmentFxQuoteActive}
              fxQuote={{
                isPending: installmentFxQuoteQuery.isPending,
                isFetching: installmentFxQuoteQuery.isFetching,
                isError: installmentFxQuoteQuery.isError,
                isSuccess: installmentFxQuoteQuery.isSuccess,
                error: installmentFxQuoteQuery.error,
                data: installmentFxQuoteQuery.data,
              }}
            />
            {repayCreditMutation.isError && paymentToPay && (
              <div className="error">
                {repayCreditMutation.error instanceof Error
                  ? repayCreditMutation.error.message
                  : 'Ошибка оплаты'}
              </div>
            )}
            <div className="modalActions">
              <Button
                variant="secondary"
                type="button"
                onClick={closePayInstallmentModal}
                disabled={repayCreditMutation.isPending}
              >
                Отмена
              </Button>
              <Button
                type="button"
                onClick={handlePayInstallment}
                disabled={
                  repayCreditMutation.isPending ||
                  payInstallmentAmount < 0.01 ||
                  !payInstallmentAccountId ||
                  installmentFundsStatus !== 'sufficient'
                }
              >
                {repayCreditMutation.isPending ? 'Оплата…' : 'Оплатить'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

