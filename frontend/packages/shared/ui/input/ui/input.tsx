import { useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { Field } from '../../field'
import '../style.css'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  suffix?: ReactNode
}

export const Input = ({ label, error, className, id: idProp, suffix, ...props }: InputProps) => {
  const genId = useId()
  const id = idProp ?? genId

  const inputClass = `input-input ${error ? 'input-error' : ''} ${className || ''}`.trim()

  const control = suffix ? (
    <div className="input-suffix-wrap">
      <input id={id} className={inputClass} {...props} />
      <span className="input-suffix" aria-hidden={typeof suffix === 'string' ? true : undefined}>
        {suffix}
      </span>
    </div>
  ) : (
    <input id={id} className={inputClass} {...props} />
  )

  return (
    <Field label={label} error={error} htmlFor={id}>
      {control}
    </Field>
  )
}
