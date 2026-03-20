import React from 'react'
import { useNavigate } from 'react-router-dom'
import { MobileAppBar, DesktopAppBar } from '@shared/ui/app-bar'
import { isMobileDevice } from '@shared/utils'

export interface NavigationButton {
  name: string
  path: string
  external?: boolean
}

export interface AppBarWithNavigationProps {
  buttons: NavigationButton[]
  onLogoClick?: () => void
}

export const AppBarWithNavigation: React.FC<AppBarWithNavigationProps> = ({
  buttons,
  onLogoClick,
}) => {
  const navigate = useNavigate()
  const isMobile = isMobileDevice()

  const navigationButtons = buttons.map((button) => ({
    name: button.name,
    onClick: button.external
      ? () => { window.location.href = button.path }
      : () => navigate(button.path),
    path: button.external ? undefined : button.path,
  }))

  const AppBar = isMobile ? MobileAppBar : DesktopAppBar

  return (
    <AppBar
      buttons={navigationButtons}
      onLogoClick={onLogoClick || (() => navigate('/'))}
    />
  )
}

