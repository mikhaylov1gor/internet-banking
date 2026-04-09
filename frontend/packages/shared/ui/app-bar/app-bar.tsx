import { DesktopAppBar, DesktopAppBarProps } from './desktop-app-bar'
import { MobileAppBar, MobileAppBarProps } from './mobile-app-bar'
import { isMobileDevice } from '../../utils/device'

export type AppBarProps = DesktopAppBarProps & MobileAppBarProps

export const AppBar = (props: AppBarProps) => {
  const isMobile = isMobileDevice()

  if (isMobile) {
    return <MobileAppBar {...props} />
  }

  return <DesktopAppBar {...props} />
}
