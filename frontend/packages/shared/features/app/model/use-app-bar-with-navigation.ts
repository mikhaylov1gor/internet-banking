import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MobileAppBar, DesktopAppBar } from '@shared/ui/app-bar'
import { isMobileDevice } from '@shared/utils'
import type { NavigationButton } from './types'

export const useAppBarWithNavigation = (
  buttons: NavigationButton[],
  onLogoClick?: () => void
) => {
  const navigate = useNavigate()
  const isMobile = isMobileDevice()

  const navigationButtons = useMemo(
    () =>
      buttons.map((button) => ({
        name: button.name,
        onClick: button.external
          ? () => {
              window.location.href = button.path
            }
          : () => {
              navigate(button.path)
            },
        path: button.external ? undefined : button.path,
      })),
    [buttons, navigate]
  )

  const AppBar = isMobile ? MobileAppBar : DesktopAppBar
  const handleLogoClick = onLogoClick ?? (() => navigate('/'))

  return { AppBar, navigationButtons, handleLogoClick }
}
