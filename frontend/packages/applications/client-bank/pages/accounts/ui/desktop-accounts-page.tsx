import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@shared/ui/button'
import { Spinner } from '@shared/ui/spinner'
import { ErrorFallback } from '@shared/ui/error-fallback'
import { Modal } from '@shared/ui/modal'
import { Select } from '@shared/ui/select'
import { DesktopPagination } from '@shared/ui/pagination'
import { AccountCard } from '@shared/ui/account-card'
import { useAccountsPage } from '../model/use-accounts-page'
import './style.css'

export const DesktopAccountsPage: React.FC = () => {
  const navigate = useNavigate()
  const {
    accounts,
    isLoading,
    showModal,
    handleOpenModal,
    handleCloseModal,
    currency,
    setCurrency,
    createAccountMutation,
    handleCreateAccount,
    status,
    setStatus,
    page,
    setPage,
    limit,
    setLimit,
    totalPages,
  } = useAccountsPage()

  return (
    <div className="accounts-page-container desktop-accounts-page">
      <div className="accounts-page-header">
        <h1 className="accounts-page-title">Мои счета</h1>
        <Button onClick={handleOpenModal}>Открыть новый счет</Button>
      </div>

      <div className="accounts-page-controls">
        <div className="accounts-page-filters">
          <Select
            label="Статус"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: '', label: 'Все' },
              { value: 'active', label: 'Активные' },
              { value: 'closed', label: 'Закрытые' },
            ]}
          />
        </div>
      </div>

      {isLoading && (
        <div className="loading">
          <Spinner />
        </div>
      )}

      {!isLoading && accounts && accounts.length === 0 && (
        <div className="empty">У вас пока нет счетов. Откройте первый счет!</div>
      )}

      {!isLoading && accounts && accounts.length > 0 && (
        <>
          <div className="list desktop-list">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onClick={() => navigate(`/accounts/${account.id}`)}
                shortenId={true}
              />
            ))}
          </div>
          <DesktopPagination
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

      <Modal isOpen={showModal} onClose={handleCloseModal} title="Открыть новый счет">
        <div className="create-account-form">
          <div className="form-group">
            <label>Валюта</label>
            <Select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as 'RUB' | 'USD' | 'EUR')}
              options={[
                { value: 'RUB', label: 'RUB' },
                { value: 'USD', label: 'USD' },
                { value: 'EUR', label: 'EUR' },
              ]}
            />
          </div>
          {createAccountMutation.isError && (
            <div className="error">
              {createAccountMutation.error instanceof Error
                ? createAccountMutation.error.message
                : 'Ошибка создания счета'}
            </div>
          )}
          <div className="modalActions">
            <Button variant="secondary" type="button" onClick={handleCloseModal}>
              Отмена
            </Button>
            <Button onClick={handleCreateAccount} disabled={createAccountMutation.isPending}>
              {createAccountMutation.isPending ? 'Создание...' : 'Создать'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

