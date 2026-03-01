import React from 'react'
import type { Credit } from '@shared/api/endpoints/credits'
import './style.css'

export interface CreditCardProps {
  credit: Credit
  onClick?: () => void
  shortenId?: boolean
  className?: string
}

export const CreditCard: React.FC<CreditCardProps> = ({
  credit,
  onClick,
  shortenId = false,
  className = '',
}) => {
  const displayId = shortenId ? `${credit.id.slice(0, 8)}...` : credit.id

  return (
    <div
      className={`credit-card ${className}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <div className="credit-card-info">
        <div className="credit-card-id">Кредит #{displayId}</div>
        <div className="credit-card-details">
          <span>Сумма: {credit.amount.toLocaleString()} ₽</span>
          {credit.status === 'active' && (
            <>
              <span>Остаток: {Number(credit.remaining).toFixed(2)} ₽</span>
              <span>Ежедневный платеж: {Math.round(credit.daily_payment).toLocaleString()} ₽</span>
            </>
          )}
          <span>Ставка: {(credit.rate * 100).toFixed(2)}%</span>
          <span className={`credit-card-status ${credit.status === 'active' ? 'active' : 'paid'}`}>
            Статус: {credit.status === 'active' ? 'Активен' : 'Погашен'}
          </span>
        </div>
      </div>
    </div>
  )
}

