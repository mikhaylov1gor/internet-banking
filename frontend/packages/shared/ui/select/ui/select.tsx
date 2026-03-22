import { useId, useState } from 'react'
import type { SelectHTMLAttributes } from 'react'
import { Field } from '../../field'
import '../style.css'

export type SelectOption = {
  value: string
  label: string
  listLabel?: string
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
  className = '',
  id: idProp,
  value: valueProp,
  defaultValue,
  disabled,
  onChange,
  ...rest
}: SelectProps) => {
  const genId = useId()
  const id = idProp ?? genId

  const isControlled = valueProp !== undefined
  const [uncontrolledValue, setUncontrolledValue] = useState(
    () => (defaultValue !== undefined ? String(defaultValue) : '')
  )

  const effectiveValue = isControlled ? String(valueProp ?? '') : uncontrolledValue

  const useListLabels = options.some((o) => o.listLabel != null && o.listLabel !== '')

  const selectedOption = options.find((o) => o.value === effectiveValue)
  const closedDisplayLabel = selectedOption?.label ?? '\u00a0'

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!isControlled) {
      setUncontrolledValue(e.target.value)
    }
    onChange?.(e)
  }

  const selectClass = `select-select ${error ? 'select-error' : ''} ${className}`.trim()
  const shellClass = `select-shell ${error ? 'select-shell--error' : ''}`.trim()

  const selectEl = (
    <select
      id={id}
      className={selectClass + (useListLabels ? ' select-select--overlay' : '')}
      value={isControlled ? valueProp : undefined}
      defaultValue={!isControlled ? defaultValue : undefined}
      disabled={disabled}
      onChange={handleChange}
      {...rest}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.listLabel ?? option.label}
        </option>
      ))}
    </select>
  )

  return (
    <Field label={label} error={error} htmlFor={id}>
      {useListLabels ? (
        <div className={shellClass}>
          <div className={`${selectClass} select-select--fake`} aria-hidden="true">
            {closedDisplayLabel}
          </div>
          {selectEl}
        </div>
      ) : (
        selectEl
      )}
    </Field>
  )
}
