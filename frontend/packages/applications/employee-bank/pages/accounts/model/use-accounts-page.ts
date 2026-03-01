import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccounts } from '../../../features/accounts'
import { getAccountById } from '@shared/api/endpoints/accounts'
import type { GetAccountsParams } from '@shared/api/endpoints/accounts'

export const useAccountsPage = () => {
  const [accountId, setAccountId] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'active' | 'closed' | ''>('')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const navigate = useNavigate()

  const params: GetAccountsParams = {
    ...(status && { status: status as 'active' | 'closed' }),
    ...(selectedUserId && { client_id: selectedUserId }),
    page,
    page_size: pageSize,
  }

  const { data: accountsResponse, isLoading } = useAccounts(params)
  const accounts = accountsResponse?.accounts || []
  const totalPages = accountsResponse?.pageQuantity || 1

  const handleSearch = async () => {
    if (!accountId.trim()) {
      setError('Введите ID счёта')
      return
    }
    try {
      await getAccountById(accountId.trim())
      navigate(`/accounts/${accountId.trim()}`)
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setError('Счёт не существует')
      } else {
        setError('Ошибка при поиске счёта')
      }
    }
  }

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus as 'active' | 'closed' | '')
    setPage(1)
  }

  const handleUserIdChange = (userId: string) => {
    setSelectedUserId(userId)
    setPage(1)
  }

  return {
    accountId,
    setAccountId,
    error,
    setError,
    accounts,
    isLoading,
    handleSearch,
    status,
    setStatus: handleStatusChange,
    selectedUserId,
    setSelectedUserId: handleUserIdChange,
    page,
    setPage,
    limit: pageSize,
    setLimit: setPageSize,
    totalPages,
  }
}


