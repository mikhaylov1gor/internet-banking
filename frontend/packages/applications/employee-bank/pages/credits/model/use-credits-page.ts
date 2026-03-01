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
  const [limit, setLimit] = useState(20)
  const navigate = useNavigate()

  const params: GetCreditsParams = {
    ...(selectedUserId && { client_id: selectedUserId }),
    limit,
    offset: (page - 1) * limit,
  }

  const { data: credits, isLoading } = useCredits(params)

  const handleSearch = async () => {
    if (!creditId.trim()) {
      setError('Введите ID кредита')
      return
    }
    try {
      await getCreditById(creditId.trim())
      navigate(`/credits/${creditId.trim()}`)
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setError('Кредит не существует')
      } else {
        setError('Ошибка при поиске кредита')
      }
    }
  }

  const handleUserIdChange = (userId: string) => {
    setSelectedUserId(userId)
    setPage(1)
  }

  const totalPages = credits
      ? (credits.length < limit ? page : page + 1)
      : 1

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
    limit,
    setLimit,
    totalPages,
  }
}

