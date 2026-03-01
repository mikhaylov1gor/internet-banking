import React from 'react'
import { useLocation } from 'react-router-dom'
import { Button } from '@shared/ui/button'
import { Spinner } from '@shared/ui/spinner'
import { ErrorFallback } from '@shared/ui/error-fallback'
import { MobilePagination, DesktopPagination } from '@shared/ui/pagination'
import { getCurrentUserId } from '@shared/features/auth'
import { useUserDetailPage } from '../model/use-user-detail-page'
import './style.css'
import {isMobile} from "../../../main";

export const UserDetailPage: React.FC = () => {
  const location = useLocation()
  const returnTo = (location.state as { returnTo?: string })?.returnTo
  const {
    user,
    userLoading,
    userError,
    credits,
    creditsLoading,
    page,
    setPage,
    limit,
    setLimit,
    toggleStatusMutation,
    handleToggleStatus,
    totalPages,
    navigate,
  } = useUserDetailPage()

  if (userLoading) {
    return (
      <div className="user-detail-page-loading">
        <Spinner size="large" />
      </div>
    )
  }

  if (userError || !user) {
    const isNotFound = (userError as any)?.response?.status === 404
    return (
      <ErrorFallback
        title="Пользователь не найден"
        message={isNotFound ? 'Пользователь с указанным ID не существует' : 'Произошла ошибка при загрузке пользователя'}
        onGoBack={() => navigate(returnTo || '/users')}
        goBackLabel="Назад"
      />
    )
  }

  const Pagination = isMobile ? MobilePagination : DesktopPagination

  return (
    <div className="user-detail-page-container">
      <Button 
        variant="secondary" 
        onClick={() => navigate(returnTo || '/users')} 
        className="user-detail-page-back-button"
      >
        ← Назад
      </Button>

      <div className="user-detail-page-user-info">
        <h1 className="user-detail-page-title">{user.full_name || user.email}</h1>
        <div className="user-detail-page-details">
          <div className="user-detail-page-detail-item">
            <span className="user-detail-page-label">Email:</span>
            <span>{user.email}</span>
          </div>
          <div className="user-detail-page-detail-item">
            <span className="user-detail-page-label">Тип:</span>
            <span>{user.type === 'client' ? 'Клиент' : 'Сотрудник'}</span>
          </div>
          <div className="user-detail-page-detail-item">
            <span className="user-detail-page-label">Статус:</span>
            <span className={user.status === 'active' ? 'user-detail-page-active' : 'user-detail-page-blocked'}>
              {user.status === 'active' ? 'Активен' : 'Заблокирован'}
            </span>
          </div>
          {user.phone && (
            <div className="user-detail-page-detail-item">
              <span className="user-detail-page-label">Телефон:</span>
              <span>{user.phone}</span>
            </div>
          )}
          <div className="user-detail-page-detail-item">
            <span className="user-detail-page-label">Создан:</span>
            <span>{new Date(user.created_at).toLocaleDateString('ru-RU')}</span>
          </div>
        </div>

        <div className="user-detail-page-actions">
          <Button
            variant={user.status === 'active' ? 'danger' : 'primary'}
            onClick={handleToggleStatus}
            disabled={toggleStatusMutation.isPending || user.id === getCurrentUserId()}
          >
            {user.status === 'active' ? 'Заблокировать' : 'Разблокировать'}
          </Button>
        </div>
      </div>

      {user.type === 'client' && (
        <div className="user-detail-page-credits">
          <h2 className="user-detail-page-subtitle">Кредиты клиента</h2>
          {creditsLoading && (
            <div className="user-detail-page-loading">
              <Spinner />
            </div>
          )}
          {credits && credits.length === 0 && (
            <div className="user-detail-page-empty">Кредиты не найдены</div>
          )}
          {credits && credits.length > 0 && (
            <>
              <div className="user-detail-page-credits-list">
                {credits.map((credit) => (
                  <div
                    key={credit.id}
                    className="user-detail-page-credit-card"
                    onClick={() => navigate(`/credits/${credit.id}`, { state: { returnTo: `/users/${user.id}` } })}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="user-detail-page-credit-header">
                      <span className="user-detail-page-credit-id">Кредит #{credit.id}</span>
                      <span className={credit.status === 'active' ? 'user-detail-page-active' : 'user-detail-page-paid'}>
                        {credit.status === 'active' ? 'Активен' : 'Погашен'}
                      </span>
                    </div>
                    <div className="user-detail-page-credit-details">
                      <div>Сумма: {credit.amount.toLocaleString()}</div>
                      <div>Остаток: {credit.remaining.toLocaleString()}</div>
                      <div>Ставка: {(credit.rate * 100).toFixed(2)}%</div>
                      <div>Ежедневный платёж: {credit.daily_payment.toLocaleString()}</div>
                    </div>
                  </div>
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
        </div>
      )}
    </div>
  )
}


