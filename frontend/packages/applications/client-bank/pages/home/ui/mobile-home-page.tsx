import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@shared/ui/button'
import './style.css'

export const MobileHomePage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="home-page-container mobile-home-page">
      <h1 className="home-page-title mobile-home-title">Z-Банк</h1>
      <div className="home-page-buttons mobile-home-buttons">
        <Button onClick={() => navigate('/accounts')} className="mobile-home-button">
          Мои счета
        </Button>
        <Button onClick={() => navigate('/credits')} className="mobile-home-button">
          Мои кредиты
        </Button>
      </div>
    </div>
  )
}

