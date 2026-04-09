import { Button } from '../button'
import './style.css'

export type ErrorFallbackProps = {
  title?: string
  message?: string
  onRetry?: () => void
  onGoBack?: () => void
  goBackLabel?: string
  variant?: 'fullscreen' | 'embedded'
}

export const ErrorFallback = ({
  title = 'Произошла ошибка',
  message = 'Что-то пошло не так. Попробуйте обновить страницу или вернуться назад.',
  onRetry,
  onGoBack,
  goBackLabel,
  variant = 'fullscreen',
}: ErrorFallbackProps) => {
  const containerClass =
    variant === 'embedded'
      ? 'error-fallback-container error-fallback-container--embedded'
      : 'error-fallback-container'

  return (
    <div className={containerClass}>
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

