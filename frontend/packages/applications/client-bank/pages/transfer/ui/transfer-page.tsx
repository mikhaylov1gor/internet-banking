import React from 'react'
import { Button } from '@shared/ui/button'
import { Input } from '@shared/ui/input'
import { Select } from '@shared/ui/select'
import { Spinner } from '@shared/ui/spinner'
import { getApiErrorMessage, getLoadDataErrorMessage } from '@shared/api'
import { useTransferPage } from '../model/use-transfer-page'
import './style.css'

export const TransferPage = () => {
  const {
    navigate,
    isLoading,
    accountsLoadError,
    fromAccountId,
    setFromAccountId,
    fromOptions,
    fromAccount,
    recipientMode,
    setRecipientMode,
    toOwnAccountId,
    setToOwnAccountId,
    toOtherAccountId,
    setToOtherAccountMasked,
    toOwnOptions,
    amountStr,
    setAmountStr,
    canSubmit,
    amountValid,
    withinBalance,
    handleSubmit,
    transferMutation,
    errorMessage,
    entryFromTopUpFlow,
    successCreditAccountId,
    successDebitAccountId,
    handleNewTransfer,
    previewRequest,
    transferPreviewQuery,
    otherRecipientSameAsDebit,
    otherRecipientNotFound,
    otherRecipientClosed,
    otherRecipientLookupErrorMessage,
    otherRecipientLookupPending,
  } = useTransferPage()

  if (isLoading) {
    return (
      <div className="transfer-page-loading">
        <Spinner size="large" />
      </div>
    )
  }

  if (accountsLoadError) {
    return (
      <div className="transfer-page-container">
        <Button variant="secondary" onClick={() => navigate(-1)} className="transfer-page-back">
          Назад
        </Button>
        <div className="transfer-page-card">
          <div className="transfer-page-error" role="alert">
            {getLoadDataErrorMessage('счета')}
          </div>
        </div>
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
                  Обратно к счёту
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setToOtherAccountMasked(e.target.value)
                    }
                    placeholder="0000-0000-0000-0000"
                    inputMode="numeric"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {otherRecipientSameAsDebit && (
                    <p className="transfer-page-field-error" role="alert">
                      Указан тот же счёт, что и для списания — перевод на свой же счёт невозможен. Введите другой номер
                      получателя.
                    </p>
                  )}
                  {!otherRecipientSameAsDebit && otherRecipientLookupPending && (
                    <p className="transfer-page-recipient-check">Проверяем номер счёта…</p>
                  )}
                  {otherRecipientNotFound && (
                    <p className="transfer-page-field-error" role="alert">
                      Счёт с таким номером не найден. Проверьте номер.
                    </p>
                  )}
                  {otherRecipientClosed && (
                    <p className="transfer-page-field-error" role="alert">
                      Счёт закрыт — перевод на него недоступен.
                    </p>
                  )}
                  {otherRecipientLookupErrorMessage && (
                    <p className="transfer-page-field-error" role="alert">
                      {otherRecipientLookupErrorMessage}
                    </p>
                  )}
                </>
              )}
            </fieldset>

            <Input
              label="Сумма перевода"
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

            {previewRequest && (
              <div className="transfer-page-preview" aria-live="polite">
                <p className="transfer-page-preview-title">Предварительный расчёт</p>
                {transferPreviewQuery.isPending && (
                  <div className="transfer-page-preview-loading">
                    <Spinner size="small" />
                    <span>Запрашиваем расчёт…</span>
                  </div>
                )}
                {transferPreviewQuery.isError && !transferPreviewQuery.isPending && (
                  <p className="transfer-page-preview-error" role="alert">
                    {getApiErrorMessage(transferPreviewQuery.error)}
                  </p>
                )}
                {transferPreviewQuery.isSuccess && transferPreviewQuery.data && (
                  <div className="transfer-page-preview-body">
                    <p className="transfer-page-preview-line">
                      К зачислению:{' '}
                      <strong>
                        {transferPreviewQuery.data.credit_amount.toLocaleString('ru-RU', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        {transferPreviewQuery.data.to_currency}
                      </strong>
                    </p>
                    {transferPreviewQuery.data.from_currency !== transferPreviewQuery.data.to_currency && (
                      <p className="transfer-page-preview-rate">
                        Курс: 1 {transferPreviewQuery.data.from_currency} ={' '}
                        {transferPreviewQuery.data.rate.toLocaleString('ru-RU', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6,
                        })}{' '}
                        {transferPreviewQuery.data.to_currency}
                      </p>
                    )}
                  </div>
                )}
              </div>
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
