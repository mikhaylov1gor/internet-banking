import React from 'react'
import type { Account } from '@shared/api/endpoints/accounts'
import './style.css'

export interface AccountCardProps {
  account: Account
  onClick?: () => void
  shortenId?: boolean
  className?: string
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  onClick,
  shortenId = false,
  className = '',
}) => {
  const displayId = shortenId ? `${account.id.slice(0, 8)}...` : account.id

  return (
    <div
      className={`account-card ${className}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <div className="account-card-info">
        <div className="account-card-id">Счёт #{displayId}</div>
        <div className="account-card-details">
          <span>Баланс: {account.balance.toLocaleString()} {account.currency || 'RUB'}</span>
          <span className={`account-card-status ${account.status === 'active' ? 'active' : 'closed'}`}>
            Статус: {account.status === 'active' ? 'Активен' : 'Закрыт'}
          </span>
        </div>
      </div>
    </div>
  )
}

