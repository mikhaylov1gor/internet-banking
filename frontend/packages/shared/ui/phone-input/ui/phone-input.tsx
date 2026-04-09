import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Field } from '../../field'
import { usePhoneInput } from '../model/use-phone-input'
import '../style.css'

export type PhoneInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: string
  error?: string
  onValidationChange?: (isValid: boolean) => void
}

export const PhoneInput = ({
  label,
  error,
  onValidationChange,
  value,
  onChange,
  className,
  id: idProp,
  ...props
}: PhoneInputProps) => {
  const genId = useId()
  const id = idProp ?? genId
  const { displayError, handleChange, handleBlur, hasError } = usePhoneInput({
    value,
    onChange,
    onValidationChange,
    externalError: error,
  })

  return (
    <Field label={label} error={displayError || undefined} htmlFor={id}>
      <input
        id={id}
        type="tel"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="+7 (999) 123-45-67"
        className={`phone-input ${hasError ? 'phone-input-error' : ''} ${className || ''}`.trim()}
        {...props}
      />
    </Field>
  )
}
