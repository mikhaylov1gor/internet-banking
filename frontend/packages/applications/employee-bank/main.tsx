import React from 'react'
import ReactDOM from 'react-dom/client'
import { setClientTelemetryServiceLabel } from '@shared/api/http/telemetry-service-id'
import { ThemeProvider } from '@shared/features/theme'

setClientTelemetryServiceLabel('employee-web')
import { ToastProvider } from '@shared/ui/toast'
import { MobileApp, DesktopApp } from './app/App'
import { isMobileDevice } from '@shared/utils'
import '@shared/ui/theme/theme.css'
import './index.css'

const isMobile = isMobileDevice()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider appType="employee">
      <ToastProvider>
        {isMobile ? <MobileApp /> : <DesktopApp />}
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>
)
