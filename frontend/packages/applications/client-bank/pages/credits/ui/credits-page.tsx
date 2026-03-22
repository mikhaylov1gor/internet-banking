import { useNavigate } from 'react-router-dom'
import { Button } from '@shared/ui/button'
import { Input } from '@shared/ui/input'
import { Spinner } from '@shared/ui/spinner'
import { Modal } from '@shared/ui/modal'
import { Select } from '@shared/ui/select'
import { DesktopPagination, MobilePagination } from '@shared/ui/pagination'
import { CreditCard } from '@shared/ui/credit-card'
import { CreditRatingGauge } from '@shared/ui/credit-rating-gauge'
import { RubDepositPreview } from '@shared/ui/rub-deposit-preview'
import {
  getApiErrorMessage,
  getIssueCreditErrorMessage,
  getLoadDataErrorMessage,
} from '@shared/api'
import { useCreditsPage } from '../model/use-credits-page'
import { isMobile } from '../../../main'
import './style.css'

export const CreditsPage = () => {
  const navigate = useNavigate()
  const {
    credits,
    isLoading,
    creditsLoadError,
    accountsLoadError,
    tariffsLoadError,
    takeCreditDisabledByTariffs,
    takeCreditTariffsHint,
    showModal,
    handleOpenModal,
    handleCloseModal,
    selectedTariff,
    setSelectedTariff,
    selectedAccount,
    setSelectedAccount,
    selectedAccountCurrency,
    amount,
    setAmount,
    amountBlurred,
    termMonths,
    setTermMonths,
    maxTermMonths,
    termValidationIssue,
    checkAvailabilityMutation,
    handleAmountBlur,
    issueCreditMutation,
    handleIssueCredit,
    noAccountsError,
    page,
    setPage,
    limit,
    setLimit,
    totalPages,
    showRatingModal,
    openRatingModal,
    closeRatingModal,
    creditRating,
    ratingLoading,
    ratingError,
    tariffLimitsHint,
    amountValidationIssue,
    issueCreditSubmitDisabled,
    tariffSelectOptions,
    accountSelectOptions,
    issueCreditPreviewPlan,
    issueCreditTransferPreviewQuery,
    issueCreditFxQuoteActive,
    issueCreditFxQuoteQuery,
  } = useCreditsPage()

  const hideIssueCreditPrecalc =
    checkAvailabilityMutation.isSuccess && checkAvailabilityMutation.data?.allowed === false

  const Pagination = isMobile ? MobilePagination : DesktopPagination

  return (
    <div className="credits-page-container">
      <div className="credits-page-header">
        <h1 className="credits-page-title">Мои кредиты</h1>
        <div className="credits-page-header-actions">
          <Button type="button" variant="secondary" onClick={openRatingModal}>
            Мой кредитный рейтинг
          </Button>
          <div className="credits-page-take-credit-block">
            {takeCreditTariffsHint ? (
              <p
                className="credits-page-take-credit-unavailable"
                role="status"
              >
                {takeCreditTariffsHint}
              </p>
            ) : (
              <Button
                type="button"
                onClick={handleOpenModal}
                disabled={takeCreditDisabledByTariffs}
              >
                Взять кредит
              </Button>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showRatingModal}
        onClose={closeRatingModal}
        title="Мой кредитный рейтинг"
      >
        <div className="credits-rating-modal-body">
          <CreditRatingGauge
            rating={creditRating}
            isLoading={ratingLoading}
            isError={ratingError}
            showTitle={false}
            showDescription
            descriptionContext="client"
            className="credits-rating-modal-gauge"
          />
        </div>
      </Modal>

      {noAccountsError && <div className="error-message">{noAccountsError}</div>}

      {isLoading && (
        <div className="loading">
          <Spinner />
        </div>
      )}

      {!isLoading && creditsLoadError && (
        <div className="empty error-message">{getLoadDataErrorMessage('кредиты')}</div>
      )}

      {!isLoading && !creditsLoadError && credits.length === 0 && (
        <div className="empty">У вас пока нет кредитов. Оформите первый кредит!</div>
      )}

      {!isLoading && !creditsLoadError && credits.length > 0 && (
        <>
          <div className="list">
            {credits.map((credit) => (
              <CreditCard
                key={credit.id}
                credit={credit}
                onClick={() => navigate(`/credits/${credit.id}`)}
              />
            ))}
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            itemsPerPage={limit}
            onItemsPerPageChange={(newLimit) => {
              setLimit(newLimit)
              setPage(1)
            }}
          />
        </>
      )}

      <Modal isOpen={showModal} onClose={handleCloseModal} title="Взять кредит">
        <div className="issue-credit-form">
          {tariffsLoadError && <div className="error">{getLoadDataErrorMessage('тарифы')}</div>}
          {accountsLoadError && <div className="error">{getLoadDataErrorMessage('счета')}</div>}
          <div className="form-group">
            <label>Тариф</label>
            <Select
              value={selectedTariff}
              onChange={(e) => setSelectedTariff(e.target.value)}
              options={tariffSelectOptions}
            />
            {tariffLimitsHint.kind === 'range' && (
              <div className="tariff-hint">
                Для выбранного тарифа минимальная&nbsp;сумма{' '}
                {tariffLimitsHint.min.toLocaleString()}
                &nbsp;₽, максимальная&nbsp;сумма {tariffLimitsHint.max.toLocaleString()}&nbsp;₽
              </div>
            )}
            {tariffLimitsHint.kind === 'min' && (
              <div className="tariff-hint">
                Для выбранного тарифа минимальная&nbsp;сумма{' '}
                {tariffLimitsHint.min.toLocaleString()}&nbsp;₽
              </div>
            )}
            {tariffLimitsHint.kind === 'max' && (
              <div className="tariff-hint">
                Для выбранного тарифа максимальная&nbsp;сумма{' '}
                {tariffLimitsHint.max.toLocaleString()}&nbsp;₽
              </div>
            )}
          </div>
          <div className="form-group">
            <Input
              label="Срок кредита, мес."
              type="number"
              min={1}
              max={maxTermMonths}
              step={1}
              value={String(termMonths)}
              onChange={(e) => setTermMonths(parseInt(e.target.value, 10) || 0)}
              placeholder="Например, 12"
            />
            <div className="tariff-hint">
              Допустимый срок на стороне банка: до {maxTermMonths} мес. (не более 3650 дней по графику).
            </div>
            {termValidationIssue && (
              <div className="error" style={{ marginTop: '8px' }}>
                {termValidationIssue}
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Счет для получения</label>
            <Select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              options={accountSelectOptions}
            />
          </div>
          <div className="form-group">
            <Input
              label="Сумма кредита, ₽"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onBlur={handleAmountBlur}
              placeholder="Введите сумму"
            />
            {amountValidationIssue && (
              <div className="error" style={{ marginTop: '8px' }}>
                {amountValidationIssue.kind === 'below_min' && (
                  <>
                    Сумма не может быть меньше {amountValidationIssue.min.toLocaleString()}&nbsp;₽
                  </>
                )}
                {amountValidationIssue.kind === 'above_max' && (
                  <>
                    Сумма не может быть больше {amountValidationIssue.max.toLocaleString()}&nbsp;₽
                  </>
                )}
              </div>
            )}

            {checkAvailabilityMutation.isPending && amountBlurred && parseFloat(amount.replace(/\s/g, '').replace(',', '.')) >= 0.01 && (
              <p className="issue-credit-availability-loading" aria-live="polite">
                Проверяем возможность выдачи…
              </p>
            )}
            {checkAvailabilityMutation.isError && amountBlurred && (
              <p className="issue-credit-preview-error" role="alert">
                {getApiErrorMessage(checkAvailabilityMutation.error)}
              </p>
            )}

            <RubDepositPreview
              variant="credit"
              plan={issueCreditPreviewPlan}
              selectedAccountCurrency={selectedAccountCurrency}
              preview={issueCreditTransferPreviewQuery}
              fxQuoteActive={issueCreditFxQuoteActive}
              fxQuote={{
                isPending: issueCreditFxQuoteQuery.isPending,
                isFetching: issueCreditFxQuoteQuery.isFetching,
                isError: issueCreditFxQuoteQuery.isError,
                isSuccess: issueCreditFxQuoteQuery.isSuccess,
                error: issueCreditFxQuoteQuery.error,
                data: issueCreditFxQuoteQuery.data,
              }}
              hidden={hideIssueCreditPrecalc}
            />
          </div>
          {issueCreditMutation.isError && (
            <div className="error">
              {getIssueCreditErrorMessage(issueCreditMutation.error)}
            </div>
          )}
          <div className="modalActions">
            <Button variant="secondary" onClick={handleCloseModal}>
              Отмена
            </Button>
            <Button onClick={handleIssueCredit} disabled={issueCreditSubmitDisabled}>
              {issueCreditMutation.isPending ? 'Оформление...' : 'Оформить'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
