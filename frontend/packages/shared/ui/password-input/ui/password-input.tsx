import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Field } from '../../field'
import { usePasswordInput } from '../model/use-password-input'
import '../style.css'

export type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: string
  error?: string
}

export const PasswordInput = ({
  label,
  error,
  className,
  id: idProp,
  ...props
}: PasswordInputProps) => {
  const genId = useId()
  const id = idProp ?? genId
  const { inputType, toggleShowPassword } = usePasswordInput()

  return (
    <Field label={label} error={error} htmlFor={id}>
      <div className="password-input-wrapper">
        <input
          id={id}
          type={inputType}
          className={`password-input ${error ? 'password-input-error' : ''} ${className || ''}`.trim()}
          {...props}
        />
        <button
          type="button"
          className="password-input-toggle-button"
          onClick={toggleShowPassword}
          tabIndex={-1}
        >
          {inputType === 'text' ? '👁️' : '👁️‍🗨️'}
        </button>
      </div>
    </Field>
  )
}
