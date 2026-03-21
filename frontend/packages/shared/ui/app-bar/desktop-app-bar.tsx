import { useLocation } from 'react-router-dom'
import { Button } from '../button'
import { ThemeToggle } from '../theme-toggle'
import { useLogout } from '@shared/features/auth'
import './style.css'

export type AppBarButton = {
  name: string
  onClick: () => void
  path?: string
}

export type DesktopAppBarProps = {
  buttons: AppBarButton[]
  onLogoClick?: () => void
}

export const DesktopAppBar = ({ buttons, onLogoClick }: DesktopAppBarProps) => {
  const location = useLocation()
  const logout = useLogout()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="app-bar desktop-app-bar">
      <div className="app-bar-container">
        <div className="logo" onClick={onLogoClick || (() => {})}>
          Z-Банк
        </div>
        <nav className="nav">
          {buttons.map((button) => (
            <Button
              key={button.name}
              variant="secondary"
              size="small"
              onClick={button.onClick}
              disabled={button.path ? isActive(button.path) : false}
            >
              {button.name}
            </Button>
          ))}
        </nav>
        <div className="app-bar-actions">
          <ThemeToggle />
          <Button variant="secondary" size="small" onClick={logout}>
            Выйти
          </Button>
        </div>
      </div>
    </div>
  )
}

