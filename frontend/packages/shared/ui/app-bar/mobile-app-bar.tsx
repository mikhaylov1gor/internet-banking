import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Button } from '../button'
import { useLogout } from '@shared/features/auth'
import './style.css'

export type AppBarButton = {
  name: string
  onClick: () => void
  path?: string
}

export type MobileAppBarProps = {
  buttons: AppBarButton[]
  onLogoClick?: () => void
}

export const MobileAppBar: React.FC<MobileAppBarProps> = ({ buttons, onLogoClick }) => {
  const location = useLocation()
  const logout = useLogout()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="app-bar mobile-app-bar">
      <div className="app-bar-container mobile-app-bar-container">
        <div className="logo mobile-logo" onClick={onLogoClick || (() => {})}>
          Z-Банк
        </div>
        <button
          className="mobile-menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={isMenuOpen ? 'open' : ''}></span>
          <span className={isMenuOpen ? 'open' : ''}></span>
          <span className={isMenuOpen ? 'open' : ''}></span>
        </button>
      </div>
      {isMenuOpen && (
        <div className="mobile-menu">
          <nav className="mobile-nav">
            {buttons.map((button) => (
              <Button
                key={button.name}
                variant="secondary"
                size="small"
                onClick={() => {
                  button.onClick()
                  setIsMenuOpen(false)
                }}
                disabled={button.path ? isActive(button.path) : false}
                className="mobile-nav-button"
              >
                {button.name}
              </Button>
            ))}
            <Button
              variant="secondary"
              size="small"
              onClick={() => {
                logout()
                setIsMenuOpen(false)
              }}
              className="mobile-nav-button"
            >
              Выйти
            </Button>
          </nav>
        </div>
      )}
    </div>
  )
}

