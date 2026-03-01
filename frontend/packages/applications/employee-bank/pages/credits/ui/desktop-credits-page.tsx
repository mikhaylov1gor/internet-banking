import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@shared/ui/button'
import { Input } from '@shared/ui/input'
import { Spinner } from '@shared/ui/spinner'
import { DesktopPagination } from '@shared/ui/pagination'
import { UserSelect } from '@shared/ui/user-select'
import { CreditCard } from '@shared/ui/credit-card'
import { useCreditsPage } from '../model/use-credits-page'
import './style.css'

export const DesktopCreditsPage: React.FC = () => {
  const navigate = useNavigate()
  const {
    creditId,
    setCreditId,
    error,
    setError,
    handleSearch,
    credits,
    isLoading,
    selectedUserId,
    setSelectedUserId,
    page,
    setPage,
    limit,
    setLimit,
    totalPages,
  } = useCreditsPage()

  return (
    <div className="credits-page-container desktop-credits-page">
      <h1 className="credits-page-title">Кредиты клиентов</h1>

      <div className="credits-page-controls">
        <div className="credits-page-search-section">
          <div className="credits-page-search-box">
            <Input
              placeholder="Введите ID кредита"
              value={creditId}
              onChange={(e) => {
                setCreditId(e.target.value)
                setError('')
              }}
              onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch()}
              error={error || undefined}
            />
            <Button onClick={handleSearch}>Найти</Button>
          </div>
        </div>

        <div className="credits-page-filters">
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

      {!isLoading && selectedUserId && credits !== undefined && credits.length === 0 && (
        <div className="empty credits-page-empty">
          <div className="empty-icon">💳</div>
          <div className="empty-text">У клиента нет кредитов</div>
        </div>
      )}

      {!isLoading && selectedUserId && credits && credits.length > 0 && (
        <>
          <div className="list desktop-list">
            {credits.map((credit) => (
              <CreditCard
                key={credit.id}
                credit={credit}
                onClick={() => navigate(`/credits/${credit.id}`)}
                shortenId={false}
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

