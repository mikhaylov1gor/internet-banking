import type { ChangeEvent } from 'react'
import { EmailInput } from '@shared/ui/email-input'
import { PasswordInput } from '@shared/ui/password-input'
import { Button } from '@shared/ui/button'
import { getApiErrorMessage } from '@shared/api'
import { login } from '@shared/api/endpoints/auth'
import { useLoginForm } from '@shared/features/auth'
import { useEmployeeLogin } from '../model/use-login-page'
import '@shared/features/auth/ui/style.css'
import './style.css'

export const MobileLoginPage = () => {
  const loginMutation = useEmployeeLogin(login)
  const {
    email,
    setEmail,
    password,
    setPassword,
    emailValid,
    setEmailValid,
    handleSubmit,
  } = useLoginForm(loginMutation)

  return (
    <div className="login-page-container mobile-login-page">
      <form onSubmit={handleSubmit} className="login-form mobile-login-form">
        <h1 className="login-form-title">Z-Банк</h1>
        <EmailInput
          label="Email"
          value={email}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          onValidationChange={setEmailValid}
          required
        />
        <PasswordInput
          label="Пароль"
          value={password}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          required
        />
        {loginMutation.isError && (
          <div className="login-form-error">
            {getApiErrorMessage(loginMutation.error, 'Ошибка авторизации')}
          </div>
        )}
        <Button type="submit" disabled={!emailValid || !password || loginMutation.isPending}>
          {loginMutation.isPending ? 'Вход...' : 'Войти'}
        </Button>
      </form>
    </div>
  )
}
