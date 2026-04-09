import type { Operation } from '@shared/api/endpoints/accounts'
import {
  getOperationTypeLabel,
  shouldHideOperationDescription,
} from '../model/operation-card-presenter'
import '../style.css'

export type OperationCardProps = {
  operation: Operation
  currency?: 'RUB' | 'USD' | 'EUR'
  className?: string
}

export const OperationCard = ({
  operation,
  currency = 'RUB',
  className = '',
}: OperationCardProps) => {
  return (
    <div className={`operation-card ${className}`}>
      <div className="operation-card-header">
        <span className="operation-card-type">{getOperationTypeLabel(operation)}</span>
        <span className="operation-card-date">
          {new Date(operation.created_at).toLocaleString('ru-RU')}
        </span>
      </div>
      <div className="operation-card-details">
        <span>
          Сумма: {operation.amount.toLocaleString()} {currency}
        </span>
        <span>
          Баланс после: {operation.balance_after.toLocaleString()} {currency}
        </span>
        {operation.description && !shouldHideOperationDescription(operation) && (
          <span>Описание: {operation.description}</span>
        )}
      </div>
    </div>
  )
}
