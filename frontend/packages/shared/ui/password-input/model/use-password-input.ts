import { useState, useCallback } from 'react'

export const usePasswordInput = () => {
  const [showPassword, setShowPassword] = useState(false)

  const toggleShowPassword = useCallback(() => {
    setShowPassword((v) => !v)
  }, [])

  return {
    showPassword,
    toggleShowPassword,
    inputType: showPassword ? ('text' as const) : ('password' as const),
  }
}
