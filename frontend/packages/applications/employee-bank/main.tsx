import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from '@shared/features/theme'
import { MobileApp, DesktopApp } from './app/App'
import { isMobileDevice } from '@shared/utils'
import '@shared/ui/theme/theme.css'
import './index.css'

const isMobile = isMobileDevice()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      {isMobile ? <MobileApp /> : <DesktopApp />}
    </ThemeProvider>
  </React.StrictMode>
)
