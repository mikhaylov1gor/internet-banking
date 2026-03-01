import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@shared/ui/button'
import { Input } from '@shared/ui/input'
import { Spinner } from '@shared/ui/spinner'
import { Modal } from '@shared/ui/modal'
import { Select } from '@shared/ui/select'
import { DesktopPagination, MobilePagination } from '@shared/ui/pagination'
import { CreditCard } from '@shared/ui/credit-card'
import { useCreditsPage } from '../model/use-credits-page'
import { isMobile } from '../../../main'
import './style.css'

export const CreditsPage: React.FC = () => {
  const navigate = useNavigate()
  const {
    credits,
    isLoading,
    accounts,
    tariffs,
    showModal,
    handleOpenModal,
    handleCloseModal,
    selectedTariff,
    setSelectedTariff,
    selectedAccount,
    setSelectedAccount,
    amount,
    setAmount,
    amountBlurred,
    setAmountBlurred,
    issueCreditMutation,
    handleIssueCredit,
    noAccountsError,
    page,
    setPage,
    limit,
    setLimit,
    totalPages,
  } = useCreditsPage()

  const Pagination = isMobile ? MobilePagination : DesktopPagination

  return (
    <div className="credits-page-container">
      <div className="credits-page-header">
        <h1 className="credits-page-title">Мои кредиты</h1>
        <Button onClick={handleOpenModal}>Взять кредит</Button>
      </div>

      {noAccountsError && (
        <div className="error-message">
          {noAccountsError}
        </div>
      )}

      {isLoading && (
        <div className="loading">
          <Spinner />
        </div>
      )}

      {credits && credits.length === 0 && (
        <div className="empty">У вас пока нет кредитов. Оформите первый кредит!</div>
      )}

      {credits && credits.length > 0 && (
        <>
          <div className="list">
            {credits.map((credit) => (
              <CreditCard
                key={credit.id}
                credit={credit}
                onClick={() => navigate(`/credits/${credit.id}`)}
                shortenId={true}
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
          <div className="form-group">
            <label>Тариф</label>
            <Select
              value={selectedTariff}
              onChange={(e) => setSelectedTariff(e.target.value)}
              options={
                tariffs
                  ? tariffs.map((tariff) => ({
                      value: tariff.id,
                      label: `${tariff.name} (${(tariff.rate * 100).toFixed(2)}%)`,
                    }))
                  : []
              }
            />
            {selectedTariff && tariffs && (() => {
              const selectedTariffData = tariffs.find(t => t.id === selectedTariff)
              if (selectedTariffData && (selectedTariffData.min_amount || selectedTariffData.max_amount)) {
                return (
                  <div className="tariff-hint">
                    {selectedTariffData.min_amount && selectedTariffData.max_amount ? (
                      <>Для выбранного тарифа минимальная{'\u00A0'}сумма {selectedTariffData.min_amount.toLocaleString()}{'\u00A0'}₽, максимальная{'\u00A0'}сумма {selectedTariffData.max_amount.toLocaleString()}{'\u00A0'}₽</>
                    ) : selectedTariffData.min_amount ? (
                      <>Для выбранного тарифа минимальная{'\u00A0'}сумма {selectedTariffData.min_amount.toLocaleString()}{'\u00A0'}₽</>
                    ) : selectedTariffData.max_amount ? (
                      <>Для выбранного тарифа максимальная{'\u00A0'}сумма {selectedTariffData.max_amount.toLocaleString()}{'\u00A0'}₽</>
                    ) : null}
                  </div>
                )
              }
              return null
            })()}
          </div>
          <div className="form-group">
            <label>Счет для получения</label>
            <Select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              options={
                accounts
                  ? accounts.map((account) => ({
                      value: account.id,
                      label: `Счет ${account.id.slice(0, 8)}... (${account.balance.toLocaleString()} ${account.currency || 'RUB'})`,
                    }))
                  : []
              }
            />
          </div>
          <div className="form-group">
            <Input
              label="Сумма"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onBlur={() => setAmountBlurred(true)}
              placeholder="Введите сумму"
            />
            {amountBlurred && selectedTariff && tariffs && (() => {
              const selectedTariffData = tariffs.find(t => t.id === selectedTariff)
              if (selectedTariffData && amount) {
                const amountValue = parseFloat(amount)
                if (!isNaN(amountValue)) {
                  const isInvalid = 
                    (selectedTariffData.min_amount && amountValue < selectedTariffData.min_amount) ||
                    (selectedTariffData.max_amount && amountValue > selectedTariffData.max_amount)
                  
                  if (isInvalid) {
                    return (
                      <div className="error" style={{ marginTop: '8px' }}>
                        {selectedTariffData.min_amount && amountValue < selectedTariffData.min_amount && (
                          <>Сумма не может быть меньше {selectedTariffData.min_amount.toLocaleString()}{'\u00A0'}₽</>
                        )}
                        {selectedTariffData.max_amount && amountValue > selectedTariffData.max_amount && (
                          <>Сумма не может быть больше {selectedTariffData.max_amount.toLocaleString()}{'\u00A0'}₽</>
                        )}
                      </div>
                    )
                  }
                }
              }
              return null
            })()}
          </div>
          {issueCreditMutation.isError && (
            <div className="error">
              {issueCreditMutation.error instanceof Error
                ? issueCreditMutation.error.message
                : 'Ошибка оформления кредита'}
            </div>
          )}
          <div className="modalActions">
            <Button variant="secondary" onClick={handleCloseModal}>
              Отмена
            </Button>
            <Button
              onClick={handleIssueCredit}
              disabled={(() => {
                if (issueCreditMutation.isPending || !selectedTariff || !selectedAccount || !amount) {
                  return true
                }
                const amountValue = parseFloat(amount)
                if (isNaN(amountValue) || amountValue <= 0) {
                  return true
                }
                const selectedTariffData = tariffs?.find(t => t.id === selectedTariff)
                if (selectedTariffData) {
                  if (selectedTariffData.min_amount && amountValue < selectedTariffData.min_amount) {
                    return true
                  }
                  if (selectedTariffData.max_amount && amountValue > selectedTariffData.max_amount) {
                    return true
                  }
                }
                return false
              })()}
            >
              {issueCreditMutation.isPending ? 'Оформление...' : 'Оформить'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

