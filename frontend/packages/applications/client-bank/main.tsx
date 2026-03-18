import React from 'react'
import ReactDOM from 'react-dom/client'
import { DesktopApp, MobileApp } from './app/App'
import { isMobileDevice } from '@shared/utils'
import './index.css'

const isMobile = isMobileDevice()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isMobile ? <MobileApp /> : <DesktopApp />}
  </React.StrictMode>
)
