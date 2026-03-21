import type { Credit } from '@shared/api/endpoints/credits'
import { CopyableId } from '../copyable-id'
import './style.css'

export type CreditCardProps = {
  credit: Credit
  onClick?: () => void
  shortenId?: boolean
  className?: string
}

export const CreditCard = ({
  credit,
  onClick,
  shortenId = false,
  className = '',
}: CreditCardProps) => {
  const displayId = shortenId ? `${credit.id.slice(0, 8)}...` : credit.id

  return (
    <div
      className={`credit-card ${onClick ? 'credit-card--clickable' : ''} ${className}`.trim()}
      onClick={onClick}
    >
      <div className="credit-card-info">
        <div className="credit-card-id-line">
          <span className="credit-card-id-prefix">Кредит</span>
          <CopyableId
            className="credit-card-id--copy"
            copyText={credit.id}
            toastOk="Номер кредита скопирован"
            title="Скопировать полный номер кредита"
            stopPropagation
          >
            {`#${displayId}`}
          </CopyableId>
        </div>
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

