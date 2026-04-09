import { useState } from 'react'
import { useTariffs, useCreateTariff } from '../../../features/tariffs'

export const useTariffsPage = () => {
  const [name, setName] = useState('')
  const [rate, setRate] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [errors, setErrors] = useState<{
    name?: string
    rate?: string
    minAmount?: string
    maxAmount?: string
  }>({})
  const [touched, setTouched] = useState<{
    name?: boolean
    rate?: boolean
    minAmount?: boolean
    maxAmount?: boolean
  }>({})

  const { data: tariffsResponse, isLoading, isError: tariffsLoadError } = useTariffs({
    page,
    page_size: pageSize,
  })
  const tariffs = tariffsResponse?.tariffs
  const totalPages = tariffsResponse?.pageQuantity || 1
  const createTariffMutation = useCreateTariff()

  const validateField = (field: 'name' | 'rate' | 'minAmount' | 'maxAmount', value: string): string | undefined => {
    if (field === 'name') {
      if (!value.trim()) {
        return 'Название обязательно'
      }
    } else if (field === 'rate') {
      if (!value.trim()) {
        return 'Процентная ставка обязательна'
      } else {
        const rateValue = parseFloat(value)
        if (isNaN(rateValue) || rateValue < 0 || rateValue > 100) {
          return 'Процентная ставка должна быть от 0 до 100'
        }
      }
    } else if (field === 'minAmount') {
      if (!value.trim()) {
        return 'Минимальная сумма обязательна'
      } else {
        const minValue = parseFloat(value)
        if (isNaN(minValue) || minValue < 0) {
          return 'Минимальная сумма должна быть положительным числом'
        }
        if (maxAmount) {
          const maxValue = parseFloat(maxAmount)
          if (!isNaN(maxValue) && minValue > maxValue) {
            return 'Минимальная сумма должна быть меньше или равна максимальной'
          }
        }
      }
    } else if (field === 'maxAmount') {
      if (!value.trim()) {
        return 'Максимальная сумма обязательна'
      } else {
        const maxValue = parseFloat(value)
        if (isNaN(maxValue) || maxValue < 0) {
          return 'Максимальная сумма должна быть положительным числом'
        }
        if (minAmount) {
          const minValue = parseFloat(minAmount)
          if (!isNaN(minValue) && minValue > maxValue) {
            return 'Максимальная сумма должна быть больше или равна минимальной'
          }
        }
      }
    }
    return undefined
  }

  const validate = (): boolean => {
    const newErrors: typeof errors = {}

    newErrors.name = validateField('name', name)
    newErrors.rate = validateField('rate', rate)
    newErrors.minAmount = validateField('minAmount', minAmount)
    newErrors.maxAmount = validateField('maxAmount', maxAmount)

    setErrors(newErrors)
    return !newErrors.name && !newErrors.rate && !newErrors.minAmount && !newErrors.maxAmount
  }

  const handleBlur = (field: 'name' | 'rate' | 'minAmount' | 'maxAmount') => {
    setTouched({ ...touched, [field]: true })
    const value = field === 'name' ? name : field === 'rate' ? rate : field === 'minAmount' ? minAmount : maxAmount
    const error = validateField(field, value)
    setErrors({ ...errors, [field]: error })

    if (field === 'minAmount' && maxAmount) {
      const maxError = validateField('maxAmount', maxAmount)
      setErrors((prevErrors) => ({ ...prevErrors, maxAmount: maxError }))
    } else if (field === 'maxAmount' && minAmount) {
      const minError = validateField('minAmount', minAmount)
      setErrors((prevErrors) => ({ ...prevErrors, minAmount: minError }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      const rateValue = parseFloat(rate)
      createTariffMutation.mutate(
        {
          name,
          rate: rateValue / 100,
          min_amount: parseFloat(minAmount),
          max_amount: parseFloat(maxAmount),
        },
        {
          onSuccess: () => {
            setName('')
            setRate('')
            setMinAmount('')
            setMaxAmount('')
            setErrors({})
            setShowModal(false)
          },
          onError: () => {
          },
        }
      )
    }
  }

  const handleOpenModal = () => {
    setShowModal(true)
    setErrors({})
    setTouched({})
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setName('')
    setRate('')
    setMinAmount('')
    setMaxAmount('')
    setErrors({})
    setTouched({})
  }

  return {
    name,
    setName,
    rate,
    setRate,
    minAmount,
    setMinAmount,
    maxAmount,
    setMaxAmount,
    tariffs,
    isLoading,
    tariffsLoadError,
    createTariffMutation,
    handleSubmit,
    page,
    setPage,
    limit: pageSize,
    setLimit: setPageSize,
    totalPages,
    showModal,
    setShowModal,
    handleOpenModal,
    handleCloseModal,
    errors,
    setErrors,
    handleBlur,
  }
}


