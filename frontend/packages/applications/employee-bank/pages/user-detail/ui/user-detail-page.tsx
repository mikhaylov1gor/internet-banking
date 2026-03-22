import { Button } from '@shared/ui/button'
import { Spinner } from '@shared/ui/spinner'
import { ErrorFallback } from '@shared/ui/error-fallback'
import { Modal } from '@shared/ui/modal'
import { MobilePagination, DesktopPagination } from '@shared/ui/pagination'
import { CreditCard } from '@shared/ui/credit-card'
import { CreditRatingGauge } from '@shared/ui/credit-rating-gauge'
import { getLoadDataErrorMessage, isNotFoundError } from '@shared/api'
import { getCurrentUserId } from '@shared/features/auth'
import { CopyableId } from '@shared/ui/copyable-id'
import { formatShortId } from '@shared/utils/format-short-id'
import { isMobileDevice } from '@shared/utils'
import { useUserDetailPage } from '../model/use-user-detail-page'
import './style.css'

const isMobile = isMobileDevice()

export const UserDetailPage = () => {
  const {
    user,
    userLoading,
    userError,
    credits,
    creditsLoading,
    creditsLoadError,
    page,
    setPage,
    limit,
    setLimit,
    toggleStatusMutation,
    handleToggleStatus,
    totalPages,
    navigate,
    returnTo,
    showRatingModal,
    openRatingModal,
    closeRatingModal,
    creditRating,
    ratingLoading,
    ratingError,
  } = useUserDetailPage()

  if (userLoading) {
    return (
      <div className="user-detail-page-loading">
        <Spinner size="large" />
      </div>
    )
  }

  if (userError || !user) {
    const notFound = userError ? isNotFoundError(userError) : true
    return (
      <ErrorFallback
        title="Пользователь не найден"
        message={
          notFound
            ? 'Пользователь с указанным ID не существует'
            : getLoadDataErrorMessage('данные пользователя')
        }
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
            <span className="user-detail-page-label">ID:</span>
            <CopyableId
              copyText={user.id}
              toastOk="ID скопирован"
              title="Скопировать полный ID"
              className="user-detail-page-id-copy"
            >
              {formatShortId(user.id)}
            </CopyableId>
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
          {user.type === 'client' && (
            <Button type="button" variant="secondary" onClick={openRatingModal}>
              Кредитный рейтинг
            </Button>
          )}
          <Button
            variant={user.status === 'active' ? 'danger' : 'primary'}
            onClick={handleToggleStatus}
            disabled={toggleStatusMutation.isPending || user.id === getCurrentUserId()}
          >
            {user.status === 'active' ? 'Заблокировать' : 'Разблокировать'}
          </Button>
        </div>
      </div>

      <Modal
        isOpen={showRatingModal}
        onClose={closeRatingModal}
        title="Кредитный рейтинг клиента"
      >
        <div className="user-detail-rating-modal-body">
          <CreditRatingGauge
            rating={creditRating}
            isLoading={ratingLoading}
            isError={ratingError}
            showTitle={false}
            showDescription
            descriptionContext="employee"
            className="user-detail-rating-modal-gauge"
          />
        </div>
      </Modal>

      {user.type === 'client' && (
        <div className="user-detail-page-credits">
          <h2 className="user-detail-page-subtitle">Кредиты клиента</h2>
          {creditsLoading && (
            <div className="user-detail-page-loading">
              <Spinner />
            </div>
          )}
          {!creditsLoading && creditsLoadError && (
            <div className="user-detail-page-empty">{getLoadDataErrorMessage('кредиты клиента')}</div>
          )}
          {!creditsLoading && !creditsLoadError && credits.length === 0 && (
            <div className="user-detail-page-empty">Кредиты не найдены</div>
          )}
          {!creditsLoadError && credits.length > 0 && (
            <>
              <div className="user-detail-page-credits-list">
                {credits.map((credit) => (
                  <CreditCard
                    key={credit.id}
                    credit={credit}
                    onClick={() =>
                      navigate(`/credits/${credit.id}`, { state: { returnTo: `/users/${user.id}` } })
                    }
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
        </div>
      )}
    </div>
  )
}
