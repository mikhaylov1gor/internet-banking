import React from 'react'
import { useLocation } from 'react-router-dom'
import { Button } from '@shared/ui/button'
import { Spinner } from '@shared/ui/spinner'
import { ErrorFallback } from '@shared/ui/error-fallback'
import { useCreditDetailPage } from '../model/use-credit-detail-page'
import './style.css'

export const CreditDetailPage: React.FC = () => {
  const location = useLocation()
  const returnTo = (location.state as { returnTo?: string })?.returnTo
  const { credit, creditLoading, creditError, client, clientLoading, tariff, tariffLoading, navigate } = useCreditDetailPage()

  if (creditLoading || clientLoading || tariffLoading) {
    return (
      <div className="credit-detail-page-loading">
        <Spinner size="large" />
      </div>
    )
  }

  if (creditError || !credit) {
    return (
      <ErrorFallback
        title="Кредит не найден"
        message="Кредит с указанным ID не существует или был удалён"
        onGoBack={() => navigate(returnTo || '/credits')}
      />
    )
  }

  return (
    <div className="credit-detail-page-container">
      <Button variant="secondary" onClick={() => navigate(returnTo || '/credits')} className="credit-detail-page-back-button">
        ← Назад
      </Button>

      <div className="credit-detail-page-credit-info">
        <h1 className="credit-detail-page-title">Кредит #{credit.id}</h1>
        <div className="credit-detail-page-details">
          <div className="credit-detail-page-detail-item">
            <span className="credit-detail-page-label">Клиент:</span>
            <span
              onClick={() => navigate(`/users/${credit.client_id}`, { state: { returnTo: `/credits/${credit.id}` } })}
              className="credit-detail-page-clickable"
            >
              {client ? (client.full_name || client.email) : credit.client_id}
            </span>
          </div>
          <div className="credit-detail-page-detail-item">
            <span className="credit-detail-page-label">Тариф:</span>
            <span>{tariff ? tariff.name : credit.tariff_id}</span>
          </div>
          <div className="credit-detail-page-detail-item">
            <span className="credit-detail-page-label">Сумма:</span>
            <span className="credit-detail-page-amount">{credit.amount.toLocaleString()} ₽</span>
          </div>
          {credit.status === 'active' && (
            <>
              <div className="credit-detail-page-detail-item">
                <span className="credit-detail-page-label">Остаток:</span>
                <span className="credit-detail-page-remaining">{credit.remaining.toLocaleString()} ₽</span>
              </div>
              <div className="credit-detail-page-detail-item">
                <span className="credit-detail-page-label">Ежедневный платеж:</span>
                <span>{credit.daily_payment.toLocaleString()} ₽</span>
              </div>
            </>
          )}
          <div className="credit-detail-page-detail-item">
            <span className="credit-detail-page-label">Процентная ставка:</span>
            <span>{(credit.rate * 100).toFixed(2)}%</span>
          </div>
          <div className="credit-detail-page-detail-item">
            <span className="credit-detail-page-label">Статус:</span>
            <span className={credit.status === 'active' ? 'credit-detail-page-active' : 'credit-detail-page-paid'}>
              {credit.status === 'active' ? 'Активен' : 'Погашен'}
            </span>
          </div>
          <div className="credit-detail-page-detail-item">
            <span className="credit-detail-page-label">Выдан:</span>
            <span>{new Date(credit.issued_at).toLocaleDateString('ru-RU')}</span>
          </div>
          {credit.paid_at && (
            <div className="credit-detail-page-detail-item">
              <span className="credit-detail-page-label">Погашен:</span>
              <span>{new Date(credit.paid_at).toLocaleDateString('ru-RU')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


