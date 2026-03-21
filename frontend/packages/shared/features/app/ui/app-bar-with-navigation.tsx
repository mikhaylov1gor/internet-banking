import { useAppBarWithNavigation } from '../model/use-app-bar-with-navigation'
import type { AppBarWithNavigationProps } from '../model/types'

export const AppBarWithNavigation = ({ buttons, onLogoClick }: AppBarWithNavigationProps) => {
  const { AppBar, navigationButtons, handleLogoClick } = useAppBarWithNavigation(buttons, onLogoClick)

  return <AppBar buttons={navigationButtons} onLogoClick={handleLogoClick} />
}
