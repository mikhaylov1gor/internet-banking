import React from 'react'
import { EmailInput } from '@shared/ui/email-input'
import { PasswordInput } from '@shared/ui/password-input'
import { Button } from '@shared/ui/button'
import { Spinner } from '@shared/ui/spinner'
import { ThemeToggle } from '@shared/ui/theme-toggle'
import { useLoginPage } from '../model/use-login'
import './style.css'

export const DesktopLoginPage: React.FC = () => {
  const {
    email,
    password,
    isWebView,
    authComplete,
    checkingSession,
    userType,
    isPending,
    isError,
    errorMessage,
    isSubmitDisabled,
    handleSubmit,
    handleEmailChange,
    handlePasswordChange,
    handleEmailValidationChange,
    goToClientApp,
    goToEmployeeApp,
  } = useLoginPage()

  if (checkingSession) {
    return (
      <div className={`login-page-container desktop-login-page ${isWebView ? 'webview' : ''}`}>
        <Spinner size="large" />
      </div>
    )
  }

  if (authComplete) {
    return (
      <div className={`login-page-container desktop-login-page ${isWebView ? 'webview' : ''}`}>
        <div className="login-form desktop-login-form">
          <h1 className="login-form-title">Z-Банк</h1>
          <div className="login-success">Вы успешно авторизованы</div>
          {userType === 'employee' && !isWebView && (
            <div className="app-select-buttons">
              <Button onClick={goToEmployeeApp}>Приложение сотрудника</Button>
              <Button variant="secondary" onClick={goToClientApp}>Приложение клиента</Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`login-page-container desktop-login-page ${isWebView ? 'webview' : ''}`}>
      <div className="login-theme-toggle"><ThemeToggle /></div>
      <form onSubmit={handleSubmit} className="login-form desktop-login-form">
        <h1 className="login-form-title">Z-Банк</h1>
        <EmailInput
          label="Email"
          value={email}
          onChange={handleEmailChange}
          onValidationChange={handleEmailValidationChange}
          required
        />
        <PasswordInput
          label="Пароль"
          value={password}
          onChange={handlePasswordChange}
          required
        />
        {isError && errorMessage && (
          <div className="login-form-error">{errorMessage}</div>
        )}
        <Button type="submit" disabled={isSubmitDisabled}>
          {isPending ? 'Вход...' : 'Войти'}
        </Button>
      </form>
    </div>
  )
}
