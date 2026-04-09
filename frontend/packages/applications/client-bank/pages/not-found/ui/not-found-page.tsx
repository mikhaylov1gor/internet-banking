import { useNavigate } from 'react-router-dom'
import { ErrorFallback } from '@shared/ui/error-fallback'
import { isAuthenticated } from '@shared/features/auth'
import './style.css'

export const NotFoundPage = () => {
  const navigate = useNavigate()
  const authenticated = isAuthenticated()

  return (
    <div className="not-found-page-container">
      <ErrorFallback
        title="Страница не найдена"
        message="Запрашиваемая страница не существует"
        onGoBack={() => navigate(authenticated ? '/' : '/login')}
        goBackLabel={authenticated ? 'На главную' : 'Войти'}
      />
    </div>
  )
}

