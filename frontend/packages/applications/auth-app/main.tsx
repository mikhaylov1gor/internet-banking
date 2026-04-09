import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from '@shared/features/theme'
import { ToastProvider } from '@shared/ui/toast'
import { App } from './app/App'
import '@shared/ui/theme/theme.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider appType="client">
      <ToastProvider>
        <App />
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>
)
