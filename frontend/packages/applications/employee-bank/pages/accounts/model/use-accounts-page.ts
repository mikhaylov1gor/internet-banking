import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccounts } from '../../../features/accounts'
import { getAccountById, getAccountBasicByNumber } from '@shared/api/endpoints/accounts'
import { useTheme } from '@shared/features/theme'
import type { GetAccountsParams } from '@shared/api/endpoints/accounts'
import {
  digitsOnlyAccountNumber,
  formatAccountNumberMasked,
  isCompleteAccountNumberDigits,
} from '@shared/utils/account-number'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

  const { data: accountsResponse, isLoading, isError: accountsLoadError } = useAccounts(params)
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
    const trimmed = accountId.trim()
    if (!trimmed) {
      setError('Введите номер счёта')
      return
    }
    try {
      if (UUID_RE.test(trimmed)) {
        await getAccountById(trimmed)
        navigate(`/accounts/${trimmed}`)
        return
      }
      const digits = digitsOnlyAccountNumber(trimmed)
      if (!isCompleteAccountNumberDigits(digits)) {
        setError('Введите 16-значный номер счёта или UUID')
        return
      }
      const basic = await getAccountBasicByNumber(digits)
      navigate(`/accounts/${basic.id}`)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } }
      if (axiosErr?.response?.status === 404) {
        setError('Счёт не существует')
      } else {
        setError('Ошибка при поиске счёта')
      }
    }
  }

  const setAccountSearchInput = (raw: string) => {
    setError('')
    if (/[a-f]/i.test(raw)) {
      setAccountId(raw)
    } else {
      setAccountId(formatAccountNumberMasked(digitsOnlyAccountNumber(raw)))
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
    setAccountId: setAccountSearchInput,
    error,
    setError,
    accounts: visibleAccounts,
    isLoading,
    accountsLoadError,
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
