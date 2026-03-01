import React from 'react'
import { Button } from '@shared/ui/button'
import { Select } from '@shared/ui/select'
import { Spinner } from '@shared/ui/spinner'
import { ErrorFallback } from '@shared/ui/error-fallback'
import { DesktopPagination, MobilePagination } from '@shared/ui/pagination'
import { useAccountDetailPage } from '../model/use-account-detail-page'
import './style.css'
import {isMobile} from "../../../main";

export const AccountDetailPage: React.FC = () => {
  const {
    account,
    accountLoading,
    accountError,
    operations,
    operationsLoading,
    limit,
    setLimit,
    page,
    setPage,
    navigate,
  } = useAccountDetailPage()

  if (accountLoading) {
    return (
      <div className="account-detail-page-loading">
        <Spinner size="large" />
      </div>
    )
  }

  if (accountError || !account) {
    return (
      <ErrorFallback
        title="Счёт не найден"
        message="Счёт с указанным ID не существует или был удалён"
        onGoBack={() => navigate('/accounts')}
      />
    )
  }

  const Pagination = isMobile ? MobilePagination : DesktopPagination

  const totalPages = Math.ceil((operations?.length || 0) / limit) || 1

  return (
    <div className="account-detail-page-container">
      <Button variant="secondary" onClick={() => navigate('/accounts')} className="account-detail-page-back-button">
        ← Назад
      </Button>

      <div className="account-detail-page-account-info">
        <h1 className="account-detail-page-title">Счёт #{account.id}</h1>
        <div className="account-detail-page-details">
          <div className="account-detail-page-detail-item">
            <span className="account-detail-page-label">Клиент:</span>
            <span
              onClick={() => navigate(`/users/${account.client_id}`, { state: { returnTo: `/accounts/${account.id}` } })}
              style={{ cursor: 'pointer', color: '#007bff', textDecoration: 'underline' }}
            >
              {account.client_id}
            </span>
          </div>
          <div className="account-detail-page-detail-item">
            <span className="account-detail-page-label">Баланс:</span>
            <span className="account-detail-page-balance">
              {account.balance.toLocaleString()} {account.currency || 'RUB'}
            </span>
          </div>
          <div className="account-detail-page-detail-item">
            <span className="account-detail-page-label">Статус:</span>
            <span className={account.status === 'active' ? 'account-detail-page-active' : 'account-detail-page-closed'}>
              {account.status === 'active' ? 'Активен' : 'Закрыт'}
            </span>
          </div>
          <div className="account-detail-page-detail-item">
            <span className="account-detail-page-label">Открыт:</span>
            <span>{new Date(account.opened_at).toLocaleDateString('ru-RU')}</span>
          </div>
        </div>
      </div>

      <div className="operations">
        <div className="operationsHeader">
          <h2 className="subtitle">История операций</h2>
          <Select
            value={limit.toString()}
            onChange={(e) => {
              setLimit(Number(e.target.value))
              setPage(1)
            }}
            options={[
              { value: '10', label: '10' },
              { value: '20', label: '20' },
              { value: '50', label: '50' },
            ]}
          />
        </div>

        {operationsLoading && (
          <div className="loading">
            <Spinner />
          </div>
        )}

        {operations && operations.length === 0 && (
          <div className="empty">Операции не найдены</div>
        )}

        {operations && operations.length > 0 && (
          <>
            <div className="operationsList">
              {operations.map((operation) => (
                <div key={operation.id} className="operationCard">
                  <div className="operationHeader">
                    <span className="operationType">
                      {operation.type === 'deposit'
                        ? 'Пополнение'
                        : operation.type === 'withdraw'
                        ? 'Снятие'
                        : operation.type === 'credit_issue'
                        ? 'Выдача кредита'
                        : operation.type === 'credit_repay'
                        ? 'Погашение кредита'
                        : operation.type}
                    </span>
                    <span className="operationDate">
                      {new Date(operation.created_at).toLocaleString('ru-RU')}
                    </span>
                  </div>
                  <div className="operationDetails">
                    <span>
                      Сумма: {operation.amount.toLocaleString()} {account.currency || 'RUB'}
                    </span>
                    <span>Баланс после: {operation.balance_after.toLocaleString()} {account.currency || 'RUB'}</span>
                    {operation.description && <span>Описание: {operation.description}</span>}
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
    </div>
  )
}


