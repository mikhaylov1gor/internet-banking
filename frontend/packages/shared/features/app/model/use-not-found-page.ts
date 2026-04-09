import { useNavigate } from 'react-router-dom'
import { isAuthenticated } from '../../auth'

export const useNotFoundPage = () => {
  const navigate = useNavigate()
  const authenticated = isAuthenticated()

  const goBack = () => navigate(authenticated ? '/' : '/login')
  const goBackLabel = authenticated ? 'На главную' : 'Войти'

  return { goBack, goBackLabel }
}
