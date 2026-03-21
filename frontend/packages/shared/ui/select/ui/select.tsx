import { useId } from 'react'
import type { SelectHTMLAttributes } from 'react'
import { Field } from '../../field'
import '../style.css'

export type SelectOption = {
  value: string
  label: string
}

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> & {
  label?: string
  options: SelectOption[]
  error?: string
}

export const Select = ({
  label,
  options,
  error,
  className,
  id: idProp,
  ...props
}: SelectProps) => {
  const genId = useId()
  const id = idProp ?? genId

  return (
    <Field label={label} error={error} htmlFor={id}>
      <select
        id={id}
        className={`select-select ${error ? 'select-error' : ''} ${className || ''}`.trim()}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  )
}
