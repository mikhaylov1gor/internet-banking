import React from 'react'
import { Button } from '../button'
import './style.css'

export type ErrorFallbackProps = {
  title?: string
  message?: string
  onRetry?: () => void
  onGoBack?: () => void
  goBackLabel?: string
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  title = 'Произошла ошибка',
  message = 'Что-то пошло не так. Попробуйте обновить страницу или вернуться назад.',
  onRetry,
  onGoBack,
  goBackLabel,
}) => {
  return (
    <div className="error-fallback-container">
      <div className="error-fallback-content">
        <h2 className="error-fallback-title">{title}</h2>
        <p className="error-fallback-message">{message}</p>
        <div className="error-fallback-actions">
          {onGoBack && (
            <Button variant="secondary" onClick={onGoBack}>
              {goBackLabel || 'На главную'}
            </Button>
          )}
          {onRetry && (
            <Button variant="primary" onClick={onRetry}>
              Попробовать снова
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

