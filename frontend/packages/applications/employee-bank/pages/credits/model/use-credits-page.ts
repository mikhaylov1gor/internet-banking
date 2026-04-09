import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isForbiddenError, isNotFoundError, isUnauthorizedError } from '@shared/api'
import { useCredits, verifyCreditExistsForNavigation } from '../../../features/credits'
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

  const { data: creditsResponse, isLoading, isError: creditsLoadError } = useCredits(params, {
    enabled: !!selectedUserId,
  })
  const credits = creditsResponse?.credits
  const totalPages = creditsResponse?.pageQuantity || 1

  const handleSearch = async () => {
    const trimmedCreditId = creditId.trim()

    if (!trimmedCreditId) {
      setError('Введите ID кредита')
      return
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(trimmedCreditId)) {
      setError('ID кредита должен быть в формате UUID')
      return
    }

    try {
      await verifyCreditExistsForNavigation(trimmedCreditId)
      navigate(`/credits/${trimmedCreditId}`)
      setError('')
    } catch (err: unknown) {
      if (isNotFoundError(err)) {
        setError('Кредит не найден')
      } else if (isForbiddenError(err)) {
        setError('Нет доступа к этому кредиту')
      } else if (isUnauthorizedError(err)) {
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
    creditsLoadError,
    selectedUserId,
    setSelectedUserId: handleUserIdChange,
    page,
    setPage,
    limit: pageSize,
    setLimit: setPageSize,
    totalPages,
  }
}
