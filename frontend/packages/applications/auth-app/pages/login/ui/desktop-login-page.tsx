import { EmailInput } from '@shared/ui/email-input'
import { PasswordInput } from '@shared/ui/password-input'
import { Button } from '@shared/ui/button'
import { InlineAlert } from '@shared/ui/inline-alert'
import { Spinner } from '@shared/ui/spinner'
import { ThemeToggle } from '@shared/ui/theme-toggle'
import { useLoginPage } from '../model/use-login'
import './style.css'

export const DesktopLoginPage = () => {
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
              <Button variant="secondary" onClick={goToClientApp}>
                Приложение клиента
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`login-page-container desktop-login-page ${isWebView ? 'webview' : ''}`}>
      <div className="login-theme-toggle">
        <ThemeToggle />
      </div>
      <form
        onSubmit={handleSubmit}
        className="login-form desktop-login-form"
      >
        <h1 className="login-form-title">Z-Банк</h1>

        <EmailInput
          label="Email"
          name="email"
          value={email}
          onChange={handleEmailChange}
          onValidationChange={handleEmailValidationChange}
          required
        />
        <PasswordInput
          label="Пароль"
          name="password"
          value={password}
          onChange={handlePasswordChange}
          required
        />
        {isError && errorMessage && <InlineAlert>{errorMessage}</InlineAlert>}
        <Button type="submit" disabled={isSubmitDisabled}>
          {isPending ? 'Вход...' : 'Войти'}
        </Button>
      </form>
    </div>
  )
}
