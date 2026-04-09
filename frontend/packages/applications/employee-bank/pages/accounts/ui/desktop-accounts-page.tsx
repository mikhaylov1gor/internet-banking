import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@shared/ui/button'
import { Input } from '@shared/ui/input'
import { Select } from '@shared/ui/select'
import { Spinner } from '@shared/ui/spinner'
import { DesktopPagination } from '@shared/ui/pagination'
import { AccountCard } from '@shared/ui/account-card'
import { getLoadDataErrorMessage } from '@shared/api'
import { useAccountsPage } from '../model/use-accounts-page'
import { UserSelect } from '@shared/ui/user-select'
import './style.css'

export const DesktopAccountsPage = () => {
  const navigate = useNavigate()
  const {
    accountId,
    setAccountId,
    error,
    handleSearch,
    accounts,
    isLoading,
    status,
    setStatus,
    selectedUserId,
    setSelectedUserId,
    page,
    setPage,
    limit,
    setLimit,
    totalPages,
    hideAccountsFeatureEnabled,
    hiddenAccountIds,
    toggleHiddenAccount,
    showHidden,
    setShowHidden,
    hiddenCount,
    accountsLoadError,
  } = useAccountsPage()

  return (
    <div className="accounts-page-container desktop-accounts-page">
      <h1 className="accounts-page-title">Счета клиентов</h1>

      <div className="accounts-page-controls">
        <div className="accounts-page-search-section">
          <div className="accounts-page-search-box">
            <Input
              placeholder="0000-0000-0000-0000"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              inputMode="numeric"
              onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch()}
              error={error || undefined}
            />
            <Button onClick={handleSearch}>Найти</Button>
          </div>
        </div>

        <div className="accounts-page-filters">
          <UserSelect
            label="Пользователь"
            value={selectedUserId}
            onChange={setSelectedUserId}
            className="accounts-page-user-select"
            userKind="all"
          />
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
          {hideAccountsFeatureEnabled && hiddenCount > 0 && (
            <Button
              variant="secondary"
              size="small"
              onClick={() => setShowHidden(!showHidden)}
            >
              {showHidden ? 'Скрыть скрытые' : `Показать скрытые (${hiddenCount})`}
            </Button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="loading">
          <Spinner />
        </div>
      )}

      {!isLoading && accountsLoadError && (
        <div className="empty error">{getLoadDataErrorMessage('счета')}</div>
      )}

      {!isLoading && !accountsLoadError && accounts && accounts.length === 0 && (
        <div className="empty">Счета не найдены</div>
      )}

      {!isLoading && !accountsLoadError && accounts && accounts.length > 0 && (
        <>
          <div className="list desktop-list">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                isHidden={hideAccountsFeatureEnabled && hiddenAccountIds.includes(account.id)}
                onToggleHidden={hideAccountsFeatureEnabled ? toggleHiddenAccount : undefined}
                onClick={() => navigate(`/accounts/${account.id}`)}
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
    </div>
  )
}

