import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@shared/ui/button'
import { Input } from '@shared/ui/input'
import { Spinner } from '@shared/ui/spinner'
import { MobilePagination } from '@shared/ui/pagination'
import { UserSelect } from '@shared/ui/user-select'
import { CreditCard } from '@shared/ui/credit-card'
import { getLoadDataErrorMessage } from '@shared/api'
import { useCreditsPage } from '../model/use-credits-page'
import './style.css'

export const MobileCreditsPage = () => {
  const navigate = useNavigate()
  const {
    creditId,
    setCreditId,
    error,
    setError,
    handleSearch,
    credits,
    isLoading,
    creditsLoadError,
    creditsQueryError,
    selectedUserId,
    setSelectedUserId,
    page,
    setPage,
    limit,
    setLimit,
    totalPages,
  } = useCreditsPage()

  return (
    <div className="credits-page-container mobile-credits-page">
      <h1 className="credits-page-title mobile-credits-title">Кредиты клиентов</h1>

      <div className="credits-page-controls mobile-credits-controls">
        <div className="credits-page-search-section mobile-search-section">
          <div className="credits-page-search-box mobile-search-box">
            <Input
              placeholder="ID кредита"
              value={creditId}
              onChange={(e) => {
                setCreditId(e.target.value)
                setError('')
              }}
              onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch()}
              error={error || undefined}
            />
            <Button onClick={handleSearch} className="mobile-search-button">Найти</Button>
          </div>
        </div>

        <div className="credits-page-filters mobile-filters">
          <UserSelect
            label="Пользователь"
            value={selectedUserId}
            onChange={setSelectedUserId}
            className="credits-page-user-select"
          />
        </div>
      </div>

      {isLoading && (
        <div className="loading">
          <Spinner />
        </div>
      )}

      {!isLoading && !selectedUserId && (
        <div className="empty credits-page-select-user">
          <div className="select-user-icon">👤</div>
          <div className="select-user-text">Выберите пользователя для просмотра кредитов</div>
        </div>
      )}

      {!isLoading && selectedUserId && creditsLoadError && (
        <div className="empty credits-page-empty error">{getLoadDataErrorMessage('кредиты', creditsQueryError)}</div>
      )}

      {!isLoading &&
        selectedUserId &&
        !creditsLoadError &&
        credits !== undefined &&
        credits.length === 0 && (
        <div className="empty credits-page-empty">
          <div className="empty-icon">💳</div>
          <div className="empty-text">У клиента нет кредитов</div>
        </div>
      )}

      {!isLoading && selectedUserId && !creditsLoadError && credits && credits.length > 0 && (
        <>
          <div className="list mobile-list">
            {credits.map((credit) => (
              <CreditCard
                key={credit.id}
                credit={credit}
                onClick={() => navigate(`/credits/${credit.id}`)}
              />
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

