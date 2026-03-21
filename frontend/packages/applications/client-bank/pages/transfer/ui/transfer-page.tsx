import React from 'react'
import { Button } from '@shared/ui/button'
import { Input } from '@shared/ui/input'
import { Select } from '@shared/ui/select'
import { Spinner } from '@shared/ui/spinner'
import { useTransferPage } from '../model/use-transfer-page'
import './style.css'

export const TransferPage = () => {
  const {
    navigate,
    isLoading,
    fromAccountId,
    setFromAccountId,
    fromOptions,
    fromAccount,
    recipientMode,
    setRecipientMode,
    toOwnAccountId,
    setToOwnAccountId,
    toOtherAccountId,
    setToOtherAccountId,
    toOwnOptions,
    amountStr,
    setAmountStr,
    canSubmit,
    amountValid,
    withinBalance,
    handleSubmit,
    transferMutation,
    errorMessage,
    showFxHint,
    otherRecipientHint,
    entryFromTopUpFlow,
    successCreditAccountId,
    successDebitAccountId,
    handleNewTransfer,
  } = useTransferPage()

  if (isLoading) {
    return (
      <div className="transfer-page-loading">
        <Spinner size="large" />
      </div>
    )
  }

  return (
    <div className="transfer-page-container">
      <Button variant="secondary" onClick={() => navigate(-1)} className="transfer-page-back">
        Назад
      </Button>

      <div className="transfer-page-header">
        <h1 className="transfer-page-title">Перевод между счетами</h1>
      </div>

      <div className="transfer-page-card">
        {transferMutation.isSuccess && (
          <div className="transfer-page-success" role="status">
            <p className="transfer-page-success-title">Перевод выполнен</p>
            <p className="transfer-page-success-text">Средства зачислены на счёт получателя.</p>
            <div className="transfer-page-success-actions">
              {entryFromTopUpFlow && successCreditAccountId ? (
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => navigate(`/accounts/${successCreditAccountId}`)}
                >
                  К пополненному счёту
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => navigate(`/accounts/${successDebitAccountId || fromAccountId}`)}
                >
                  История списания
                </Button>
              )}
              <Button size="small" onClick={handleNewTransfer}>
                Новый перевод
              </Button>
            </div>
          </div>
        )}

        {!transferMutation.isSuccess && (
          <>
            <Select
              label="Счёт списания"
              value={fromAccountId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const nextFrom = e.target.value
                setFromAccountId(nextFrom)
                setToOwnAccountId((prev) => (prev === nextFrom ? '' : prev))
              }}
              options={fromOptions}
            />

            {fromAccount && (
              <p className="transfer-page-balance-hint">
                Доступно:{' '}
                <strong>
                  {fromAccount.balance.toLocaleString('ru-RU', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  {fromAccount.currency || 'RUB'}
                </strong>
              </p>
            )}

            <fieldset className="transfer-page-recipient-fieldset">
              <legend className="transfer-page-legend">Получатель</legend>
              <div className="transfer-page-segmented" role="tablist" aria-label="Тип получателя">
                <button
                  type="button"
                  role="tab"
                  aria-selected={recipientMode === 'own'}
                  className={`transfer-page-segment ${recipientMode === 'own' ? 'transfer-page-segment--active' : ''}`}
                  onClick={() => setRecipientMode('own')}
                >
                  Мой счёт
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={recipientMode === 'other'}
                  className={`transfer-page-segment ${recipientMode === 'other' ? 'transfer-page-segment--active' : ''}`}
                  onClick={() => setRecipientMode('other')}
                >
                  Чужой счёт
                </button>
              </div>

              {recipientMode === 'own' && (
                <>
                  {toOwnOptions.length === 0 ? (
                    <p className="transfer-page-muted">Нет других активных счетов.</p>
                  ) : (
                    <Select
                      label="Счёт зачисления"
                      value={toOwnAccountId}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setToOwnAccountId(e.target.value)}
                      options={[{ value: '', label: 'Выберите счёт' }, ...toOwnOptions]}
                    />
                  )}
                </>
              )}

              {recipientMode === 'other' && (
                <>
                  <Input
                    label="Номер счёта получателя"
                    value={toOtherAccountId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToOtherAccountId(e.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {otherRecipientHint && <p className="transfer-page-muted">{otherRecipientHint}</p>}
                </>
              )}
            </fieldset>

            {showFxHint && (
              <p className="transfer-page-fx-hint">
                Если валюты счетов различаются, сумма к зачислению рассчитывается по курсу банка на момент операции.
              </p>
            )}

            <Input
              label="Сумма списания"
              type="text"
              inputMode="decimal"
              value={amountStr}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmountStr(e.target.value)}
              placeholder={fromAccount ? `Например, 1 000,50 ${fromAccount.currency || 'RUB'}` : '0,00'}
            />

            {amountStr !== '' && !amountValid && (
              <p className="transfer-page-field-error">Минимальная сумма — 0,01</p>
            )}
            {amountStr !== '' && amountValid && fromAccount && !withinBalance && (
              <p className="transfer-page-field-error">Недостаточно средств на счёте списания</p>
            )}

            {errorMessage && <div className="transfer-page-error">{errorMessage}</div>}

            <div className="transfer-page-actions">
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || transferMutation.isPending}
              >
                {transferMutation.isPending ? 'Выполняем перевод…' : 'Перевести'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
