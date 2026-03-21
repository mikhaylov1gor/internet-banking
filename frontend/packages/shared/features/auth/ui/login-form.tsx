import type { ChangeEvent } from 'react'
import { getApiErrorMessage } from '@shared/api'
import { EmailInput } from '@shared/ui/email-input'
import { PasswordInput } from '@shared/ui/password-input'
import { Button } from '@shared/ui/button'
import { useLogin, useLoginForm, type LoginRequest, type LoginResponse } from '../model'
import './style.css'

type LoginFormProps = {
  loginFn: (data: LoginRequest) => Promise<LoginResponse>
}

export const LoginForm = ({ loginFn }: LoginFormProps) => {
  const loginMutation = useLogin(loginFn)
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
    <form onSubmit={handleSubmit} className="login-form">
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
  )
}
