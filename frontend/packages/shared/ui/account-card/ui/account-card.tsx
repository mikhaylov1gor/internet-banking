import type { Account } from '@shared/api/endpoints/accounts'
import { CopyableId } from '../../copyable-id'
import { useAccountCard } from '../model/use-account-card'
import '../style.css'

export type AccountCardProps = {
  account: Account
  onClick?: () => void
  shortenId?: boolean
  className?: string
  isHidden?: boolean
  onToggleHidden?: (accountId: string) => void
}

export const AccountCard = ({
  account,
  onClick,
  shortenId = false,
  className = '',
  isHidden = false,
  onToggleHidden,
}: AccountCardProps) => {
  const {
    sensitiveRevealed,
    handleToggleHidden,
    handleSensitiveAreaClick,
    handleSensitiveAreaKeyDown,
  } = useAccountCard({
    accountId: account.id,
    isHidden,
    onToggleHidden,
  })

  const displayId = shortenId ? `${account.id.slice(0, 8)}...` : account.id

  const detailsInner = (
    <>
      <span>
        Баланс: {account.balance.toLocaleString()} {account.currency || 'RUB'}
      </span>
      <span className={`account-card-status ${account.status === 'active' ? 'active' : 'closed'}`}>
        Статус: {account.status === 'active' ? 'Активен' : 'Закрыт'}
      </span>
    </>
  )

  return (
    <div
      className={`account-card ${onClick ? 'account-card--clickable' : ''} ${className}`.trim()}
      onClick={onClick}
    >
      <div className="account-card-info">
        <div className="account-card-header">
          <div className="account-card-id-line">
            <span className="account-card-id-prefix">Счёт</span>
            <CopyableId
              className="account-card-id--copy"
              copyText={account.id}
              toastOk="Номер счёта скопирован"
              title="Скопировать полный номер счёта"
              stopPropagation
            >
              {`#${displayId}`}
            </CopyableId>
          </div>
          {onToggleHidden && (
            <button
              type="button"
              className={`account-card-hide-btn ${isHidden ? 'account-card-hide-btn--hidden' : ''}`}
              onClick={handleToggleHidden}
              title={isHidden ? 'Показать счёт в списке' : 'Скрыть счёт из списка'}
              aria-label={isHidden ? 'Показать счёт в списке' : 'Скрыть счёт из списка'}
            >
              {isHidden ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.43 13.43 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" y1="2" x2="22" y2="22" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          )}
        </div>
        {!isHidden && <div className="account-card-details">{detailsInner}</div>}
        {isHidden && (
          <div
            className={`account-card-sensitive ${sensitiveRevealed ? 'account-card-sensitive--revealed' : ''}`}
            onClick={handleSensitiveAreaClick}
            onKeyDown={handleSensitiveAreaKeyDown}
            role="button"
            tabIndex={0}
            aria-pressed={sensitiveRevealed}
            aria-label={
              sensitiveRevealed
                ? 'Скрыть баланс и статус (нажмите снова)'
                : 'Показать баланс и статус'
            }
          >
            <div
              className={`account-card-details account-card-sensitive__inner ${!sensitiveRevealed ? 'account-card-sensitive__inner--blurred' : ''}`}
            >
              {detailsInner}
            </div>
            {!sensitiveRevealed && (
              <span className="account-card-sensitive-hint">Нажмите, чтобы показать данные</span>
            )}
            {sensitiveRevealed && (
              <span className="account-card-sensitive-hint account-card-sensitive-hint--dim">
                Нажмите, чтобы снова скрыть
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
