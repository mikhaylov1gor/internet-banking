import { useNavigate } from 'react-router-dom'
import { Button } from '@shared/ui/button'
import './style.css'

export const MobileHomePage = () => {
  const navigate = useNavigate()

  return (
    <div className="home-page-container mobile-home-page">
      <h1 className="home-page-title mobile-home-title">Z-Банк</h1>
      <div className="home-page-buttons mobile-home-buttons">
        <Button onClick={() => navigate('/accounts')} className="mobile-home-button">
          Счета клиентов
        </Button>
        <Button onClick={() => navigate('/tariffs')} className="mobile-home-button">
          Тарифы кредитов
        </Button>
        <Button onClick={() => navigate('/users')} className="mobile-home-button">
          Список пользователей
        </Button>
      </div>
    </div>
  )
}

