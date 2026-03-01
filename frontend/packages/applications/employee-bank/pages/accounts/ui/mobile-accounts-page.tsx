import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@shared/ui/button'
import { Input } from '@shared/ui/input'
import { Select } from '@shared/ui/select'
import { Spinner } from '@shared/ui/spinner'
import { MobilePagination } from '@shared/ui/pagination'
import { useAccountsPage } from '../model/use-accounts-page'
import './style.css'

export const MobileAccountsPage: React.FC = () => {
  const navigate = useNavigate()
  const {
    accountId,
    setAccountId,
    error,
    setError,
    handleSearch,
    accounts,
    isLoading,
    status,
    setStatus,
    page,
    setPage,
    limit,
    setLimit,
    totalPages,
  } = useAccountsPage()

  return (
    <div className="accounts-page-container mobile-accounts-page">
      <h1 className="accounts-page-title mobile-accounts-title">Счета клиентов</h1>

      <div className="accounts-page-controls mobile-accounts-controls">
        <div className="accounts-page-search-section mobile-search-section">
          <div className="accounts-page-search-box mobile-search-box">
            <Input
              placeholder="ID счёта"
              value={accountId}
              onChange={(e) => {
                setAccountId(e.target.value)
                setError('')
              }}
              onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch()}
              error={error || undefined}
            />
            <Button onClick={handleSearch} className="mobile-search-button">Найти</Button>
          </div>
        </div>

        <div className="accounts-page-filters mobile-filters">
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

      {!isLoading && accounts && accounts.length === 0 && <div className="empty">Счета не найдены</div>}

      {!isLoading && accounts && accounts.length > 0 && (
        <>
          <div className="list mobile-list">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="accountCard mobile-accountCard"
                onClick={() => navigate(`/accounts/${account.id}`)}
              >
                <div className="accountInfo">
                  <div className="accountId">Счёт #{account.id}</div>
                  <div className="accountDetails">
                    <span>Баланс: {account.balance} {account.currency || 'RUB'}</span>
                    <span className={account.status === 'active' ? 'active' : 'closed'}>
                      Статус: {account.status === 'active' ? 'Активен' : 'Закрыт'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <MobilePagination
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
    </div>
  )
}

