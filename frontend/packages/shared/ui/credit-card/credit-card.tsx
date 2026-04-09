import type { Credit } from '@shared/api/endpoints/credits'
import { formatShortId } from '@shared/utils/format-short-id'
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
  shortenId = true,
  className = '',
}: CreditCardProps) => {
  const displayId = shortenId ? formatShortId(credit.id) : credit.id

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
          <span>
            Сумма:{' '}
            {credit.amount.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₽
          </span>
          {credit.status === 'active' && (
            <>
              <span>
                Остаток:{' '}
                {Number(credit.remaining).toLocaleString('ru-RU', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                ₽
              </span>
              <span>
                Ежедневный платеж:{' '}
                {Math.round(credit.daily_payment).toLocaleString('ru-RU', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}{' '}
                ₽
              </span>
            </>
          )}
          <span>Ставка: {(credit.rate * 100).toFixed(2)}%</span>
          <span
            className={`credit-card-status ${credit.status === 'active' ? 'active' : credit.status === 'overdue' ? 'overdue' : 'paid'}`}
          >
            Статус:{' '}
            {credit.status === 'active' ? 'Активен' : credit.status === 'overdue' ? 'Просрочен' : 'Погашен'}
          </span>
        </div>
      </div>
    </div>
  )
}

