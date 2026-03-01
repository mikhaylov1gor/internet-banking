import React from 'react'
import { DesktopAppBar, DesktopAppBarProps } from './desktop-app-bar'
import { MobileAppBar, MobileAppBarProps } from './mobile-app-bar'
import { isMobileDevice } from '../../utils/device'

export type AppBarProps = DesktopAppBarProps & MobileAppBarProps

export const AppBar: React.FC<AppBarProps> = (props) => {
  const isMobile = isMobileDevice()

  if (isMobile) {
    return <MobileAppBar {...props} />
  }

  return <DesktopAppBar {...props} />
}
