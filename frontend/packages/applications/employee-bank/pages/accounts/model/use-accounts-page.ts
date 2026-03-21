import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccounts } from '../../../features/accounts'
import { getAccountById } from '@shared/api/endpoints/accounts'
import { useTheme } from '@shared/features/theme'
import type { GetAccountsParams } from '@shared/api/endpoints/accounts'

export const useAccountsPage = () => {
  const [accountId, setAccountId] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'active' | 'closed' | ''>('')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [showHidden, setShowHidden] = useState(false)
  const navigate = useNavigate()

  const { hiddenAccountIds, toggleHiddenAccount, hideAccountsFeatureEnabled } = useTheme()

  const params: GetAccountsParams = {
    ...(status && { status: status as 'active' | 'closed' }),
    ...(selectedUserId && { client_id: selectedUserId }),
    page,
    page_size: pageSize,
  }

  const { data: accountsResponse, isLoading } = useAccounts(params)
  const allAccounts = accountsResponse?.accounts ?? []
  const totalPages = accountsResponse?.pageQuantity || 1

  const visibleAccounts =
    !hideAccountsFeatureEnabled
      ? allAccounts
      : showHidden
        ? allAccounts
        : allAccounts.filter((a) => !hiddenAccountIds.includes(a.id))

  const hiddenCount = hideAccountsFeatureEnabled
    ? allAccounts.filter((a) => hiddenAccountIds.includes(a.id)).length
    : 0

  const handleSearch = async () => {
    if (!accountId.trim()) {
      setError('Введите ID счёта')
      return
    }
    try {
      await getAccountById(accountId.trim())
      navigate(`/accounts/${accountId.trim()}`)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } }
      if (axiosErr?.response?.status === 404) {
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
    accounts: visibleAccounts,
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
    hiddenAccountIds,
    toggleHiddenAccount,
    showHidden,
    setShowHidden,
    hiddenCount,
    hideAccountsFeatureEnabled,
  }
}
