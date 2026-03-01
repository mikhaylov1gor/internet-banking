import React, { useState } from 'react'
import { EmailInput } from '@shared/ui/email-input'
import { PasswordInput } from '@shared/ui/password-input'
import { Button } from '@shared/ui/button'
import { login } from '@shared/api/endpoints/auth'
import { useEmployeeLogin } from '../model/use-login-page'
import '@shared/features/auth/ui/style.css'
import './style.css'

export const DesktopLoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailValid, setEmailValid] = useState(false)
  const loginMutation = useEmployeeLogin(login)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (emailValid && password) {
      loginMutation.mutate({ email, password })
    }
  }

  return (
    <div className="login-page-container desktop-login-page">
      <form onSubmit={handleSubmit} className="login-form desktop-login-form">
        <h1 className="login-form-title">Z-Банк</h1>
        <EmailInput
          label="Email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          onValidationChange={setEmailValid}
          required
        />
        <PasswordInput
          label="Пароль"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          required
        />
        {loginMutation.isError && (
          <div className="login-form-error">
            {(() => {
              const error = loginMutation.error as any
              if (error?.response?.data?.error) {
                return error.response.data.error
              }
              if (error instanceof Error) {
                return error.message
              }
              return 'Ошибка авторизации'
            })()}
          </div>
        )}
        <Button type="submit" disabled={!emailValid || !password || loginMutation.isPending}>
          {loginMutation.isPending ? 'Вход...' : 'Войти'}
        </Button>
      </form>
    </div>
  )
}

