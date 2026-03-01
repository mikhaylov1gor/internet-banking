import React from 'react'
import type { Operation } from '@shared/api/endpoints/accounts'
import './style.css'

export interface OperationCardProps {
  operation: Operation
  currency?: 'RUB' | 'USD' | 'EUR'
  className?: string
}

const getOperationTypeLabel = (type: string): string => {
  switch (type) {
    case 'deposit':
      return 'Пополнение'
    case 'withdraw':
      return 'Снятие'
    case 'credit_issue':
      return 'Выдача кредита'
    case 'credit_repay':
      return 'Погашение кредита'
    default:
      return type
  }
}

export const OperationCard: React.FC<OperationCardProps> = ({
  operation,
  currency = 'RUB',
  className = '',
}) => {
  return (
    <div className={`operation-card ${className}`}>
      <div className="operation-card-header">
        <span className="operation-card-type">
          {getOperationTypeLabel(operation.type)}
        </span>
        <span className="operation-card-date">
          {new Date(operation.created_at).toLocaleString('ru-RU')}
        </span>
      </div>
      <div className="operation-card-details">
        <span>
          Сумма: {operation.amount.toLocaleString()} {currency}
        </span>
        <span>Баланс после: {operation.balance_after.toLocaleString()} {currency}</span>
        {operation.description && <span>Описание: {operation.description}</span>}
      </div>
    </div>
  )
}

