import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Field } from '../../field'
import '../style.css'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
}

export const Input = ({ label, error, className, id: idProp, ...props }: InputProps) => {
  const genId = useId()
  const id = idProp ?? genId

  return (
    <Field label={label} error={error} htmlFor={id}>
      <input
        id={id}
        className={`input-input ${error ? 'input-error' : ''} ${className || ''}`.trim()}
        {...props}
      />
    </Field>
  )
}
