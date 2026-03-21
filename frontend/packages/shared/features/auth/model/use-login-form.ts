import { useState } from 'react'
import type { FormEvent } from 'react'
import type { UseMutationResult } from '@tanstack/react-query'
import type { LoginRequest, LoginResponse } from '@shared/api/endpoints/auth'

export const useLoginForm = (
  loginMutation: UseMutationResult<LoginResponse, Error, LoginRequest>
) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailValid, setEmailValid] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (emailValid && password) {
      loginMutation.mutate({ email, password })
    }
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    emailValid,
    setEmailValid,
    handleSubmit,
  }
}
