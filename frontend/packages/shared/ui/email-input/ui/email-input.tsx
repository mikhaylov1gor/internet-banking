import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Field } from '../../field'
import { useEmailInput } from '../model/use-email-input'
import '../style.css'

export type EmailInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: string
  error?: string
  onValidationChange?: (isValid: boolean) => void
}

export const EmailInput = ({
  label,
  error,
  onValidationChange,
  value,
  onChange,
  className,
  id: idProp,
  ...props
}: EmailInputProps) => {
  const genId = useId()
  const id = idProp ?? genId
  const { displayError, handleChange, handleBlur, hasError } = useEmailInput({
    value,
    onChange,
    onValidationChange,
    externalError: error,
  })

  return (
    <Field label={label} error={displayError || undefined} htmlFor={id}>
      <input
        id={id}
        type="email"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`email-input ${hasError ? 'email-input-error' : ''} ${className || ''}`.trim()}
        {...props}
      />
    </Field>
  )
}
