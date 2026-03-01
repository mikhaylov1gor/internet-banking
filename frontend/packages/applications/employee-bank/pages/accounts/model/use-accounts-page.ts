import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccounts } from '../../../features/accounts'
import { getAccountById } from '@shared/api/endpoints/accounts'
import type { GetAccountsParams } from '@shared/api/endpoints/accounts'

export const useAccountsPage = () => {
  const [accountId, setAccountId] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'active' | 'closed' | ''>('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const navigate = useNavigate()

  const params: GetAccountsParams = {
    ...(status && { status: status as 'active' | 'closed' }),
    limit,
    offset: (page - 1) * limit,
  }

  const { data: accounts, isLoading } = useAccounts(params)

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

  const totalPages = accounts 
    ? (accounts.length < limit ? page : page + 1)
    : 1

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
    page,
    setPage,
    limit,
    setLimit,
    totalPages,
  }
}


