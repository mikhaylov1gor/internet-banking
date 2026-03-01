import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@shared/ui/button'
import './style.css'

export const DesktopHomePage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="home-page-container desktop-home-page">
      <h1 className="home-page-title">Z-Банк</h1>
      <div className="home-page-buttons desktop-home-buttons">
        <Button onClick={() => navigate('/accounts')}>Счета клиентов</Button>
        <Button onClick={() => navigate('/tariffs')}>Тарифы кредитов</Button>
        <Button onClick={() => navigate('/users')}>Список пользователей</Button>
      </div>
    </div>
  )
}

