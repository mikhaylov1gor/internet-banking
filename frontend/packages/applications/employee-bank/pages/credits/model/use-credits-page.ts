import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCredits } from '../../../features/credits'
import { getCreditById } from '@shared/api/endpoints/credits'
import type { GetCreditsParams } from '@shared/api/endpoints/credits'

export const useCreditsPage = () => {
  const [creditId, setCreditId] = useState('')
  const [error, setError] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const navigate = useNavigate()

  const params: GetCreditsParams = {
    ...(selectedUserId && { client_id: selectedUserId }),
    page,
    page_size: pageSize,
  }

  const { data: creditsResponse, isLoading } = useCredits(params)
  const credits = creditsResponse?.credits
  const totalPages = creditsResponse?.pageQuantity || 1

  const handleSearch = async () => {
    const trimmedCreditId = creditId.trim()
    
    if (!trimmedCreditId) {
      setError('Введите ID кредита')
      return
    }

    // Валидация формата UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(trimmedCreditId)) {
      setError('ID кредита должен быть в формате UUID')
      return
    }

    try {
      await getCreditById(trimmedCreditId)
      navigate(`/credits/${trimmedCreditId}`)
      setError('')
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setError('Кредит не найден')
      } else if (err?.response?.status === 403) {
        setError('Нет доступа к этому кредиту')
      } else if (err?.response?.status === 401) {
        setError('Необходима авторизация')
      } else {
        setError('Ошибка при поиске кредита. Попробуйте еще раз')
      }
    }
  }

  const handleUserIdChange = (userId: string) => {
    setSelectedUserId(userId)
    setPage(1)
  }

  return {
    creditId,
    setCreditId,
    error,
    setError,
    handleSearch,
    credits,
    isLoading,
    selectedUserId,
    setSelectedUserId: handleUserIdChange,
    page,
    setPage,
    limit: pageSize,
    setLimit: setPageSize,
    totalPages,
  }
}

