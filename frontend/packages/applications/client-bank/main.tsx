import React from 'react'
import ReactDOM from 'react-dom/client'
import { setClientTelemetryServiceLabel } from '@shared/api/http/telemetry-service-id'
import { ThemeProvider } from '@shared/features/theme'

setClientTelemetryServiceLabel('web-client')
import { ToastProvider } from '@shared/ui/toast'
import { DesktopApp, MobileApp } from './app/App'
import { isMobileDevice } from '@shared/utils'
import '@shared/ui/theme/theme.css'
import './index.css'

const isMobile = isMobileDevice()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider appType="client">
      <ToastProvider>
        {isMobile ? <MobileApp /> : <DesktopApp />}
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>
)
