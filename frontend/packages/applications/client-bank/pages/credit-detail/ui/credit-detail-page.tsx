import React from 'react'
import { Button } from '@shared/ui/button'
import { Input } from '@shared/ui/input'
import { Spinner } from '@shared/ui/spinner'
import { ErrorFallback } from '@shared/ui/error-fallback'
import { Modal } from '@shared/ui/modal'
import { useCreditDetailPage } from '../model/use-credit-detail-page'
import './style.css'

export const CreditDetailPage: React.FC = () => {
  const {
    credit,
    creditLoading,
    creditError,
    showRepayModal,
    setShowRepayModal,
    repayAmount,
    setRepayAmount,
    repayCreditMutation,
    handleRepay,
    navigate,
  } = useCreditDetailPage()

  if (creditLoading) {
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
        onGoBack={() => navigate('/credits')}
      />
    )
  }

  return (
    <div className="credit-detail-page-container">
      <Button variant="secondary" onClick={() => navigate('/credits')} className="credit-detail-page-back-button">
        ← Назад
      </Button>

      <div className="credit-detail-page-credit-info">
        <h1 className="credit-detail-page-title">Кредит #{credit.id.slice(0, 8)}...</h1>
        <div className="credit-detail-page-details">
          <div className="credit-detail-page-detail-item">
            <span className="credit-detail-page-label">Сумма:</span>
            <span className="credit-detail-page-amount">{credit.amount.toLocaleString()} ₽</span>
          </div>
          <div className="credit-detail-page-detail-item">
            <span className="credit-detail-page-label">Остаток:</span>
            <span className="credit-detail-page-remaining">{credit.remaining.toLocaleString()} ₽</span>
          </div>
          <div className="credit-detail-page-detail-item">
            <span className="credit-detail-page-label">Процентная ставка:</span>
            <span>{(credit.rate * 100).toFixed(2)}%</span>
          </div>
          <div className="credit-detail-page-detail-item">
            <span className="credit-detail-page-label">Ежедневный платеж:</span>
            <span>{credit.daily_payment.toLocaleString()} ₽</span>
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
          <div className="credit-detail-page-detail-item">
            <span className="credit-detail-page-label">Счет:</span>
            <span 
              className="credit-detail-page-account-link"
              onClick={() => navigate(`/accounts/${credit.account_id}`, { state: { fromCredit: true, creditId: credit.id } })}
            >
              #{credit.account_id.slice(0, 8)}...
            </span>
          </div>
          {credit.paid_at && (
            <div className="credit-detail-page-detail-item">
              <span className="credit-detail-page-label">Погашен:</span>
              <span>{new Date(credit.paid_at).toLocaleDateString('ru-RU')}</span>
            </div>
          )}
        </div>

        {credit.status === 'active' && (
          <div className="actions">
            <Button onClick={() => setShowRepayModal(true)}>Погасить кредит</Button>
          </div>
        )}
      </div>

      <Modal isOpen={showRepayModal} onClose={() => setShowRepayModal(false)} title="Погасить кредит">
        <div className="repay-form">
          <Input
            label="Сумма погашения"
            type="number"
            min="0.01"
            step="0.01"
            max={credit.remaining}
            value={repayAmount}
            onChange={(e) => {
              const value = e.target.value
              const numValue = parseFloat(value)
              if (value === '' || (numValue > 0 && numValue <= credit.remaining)) {
                setRepayAmount(value)
              }
            }}
            placeholder={`Максимум: ${credit.remaining.toLocaleString()} ₽`}
          />
          {repayAmount && parseFloat(repayAmount) > credit.remaining && (
            <div className="error" style={{ marginTop: '10px' }}>
              Сумма погашения не может превышать остаток долга ({credit.remaining.toLocaleString()} ₽)
            </div>
          )}
          {repayCreditMutation.isError && (
            <div className="error">
              {repayCreditMutation.error instanceof Error
                ? repayCreditMutation.error.message
                : 'Ошибка погашения кредита'}
            </div>
          )}
          <div className="modalActions">
            <Button variant="secondary" onClick={() => setShowRepayModal(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleRepay} 
              disabled={
                repayCreditMutation.isPending || 
                !repayAmount || 
                parseFloat(repayAmount) <= 0 || 
                parseFloat(repayAmount) > credit.remaining
              }
            >
              {repayCreditMutation.isPending ? 'Погашение...' : 'Погасить'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

