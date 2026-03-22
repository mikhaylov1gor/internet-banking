import { useState } from 'react'
import { useAccounts, useCreateAccount } from '../../../features/accounts'
import { getCurrentUserId } from '@shared/features/auth'
import { useTheme } from '@shared/features/theme'
import type { GetAccountsParams } from '@shared/api/endpoints/accounts'

export const useAccountsPage = () => {
  const [showModal, setShowModal] = useState(false)
  const [currency, setCurrency] = useState<'RUB' | 'USD' | 'EUR'>('RUB')
  const [status, setStatus] = useState<'active' | 'closed' | ''>('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [showHidden, setShowHidden] = useState(false)
  const clientId = getCurrentUserId()

  const { hiddenAccountIds, toggleHiddenAccount } = useTheme()

  const params: Omit<GetAccountsParams, 'client_id'> = {
    ...(status && { status: status as 'active' | 'closed' }),
    page,
    page_size: pageSize,
  }

  const { data: accountsResponse, isLoading, isError: accountsLoadError } = useAccounts(params)
  const allAccounts = accountsResponse?.accounts ?? []
  const totalPages = accountsResponse?.pageQuantity || 1
  const createAccountMutation = useCreateAccount()

  const visibleAccounts = showHidden
    ? allAccounts
    : allAccounts.filter((a) => !hiddenAccountIds.includes(a.id))

  const hiddenCount = allAccounts.filter((a) => hiddenAccountIds.includes(a.id)).length

  const handleOpenModal = () => {
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setCurrency('RUB')
  }

  const handleCreateAccount = () => {
    if (!clientId) {
      return
    }
    createAccountMutation.mutate(
      { currency },
      {
        onSuccess: () => {
          handleCloseModal()
        },
      }
    )
  }

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus as 'active' | 'closed' | '')
    setPage(1)
  }

  return {
    accounts: visibleAccounts,
    allAccounts,
    isLoading,
    accountsLoadError,
    showModal,
    handleOpenModal,
    handleCloseModal,
    currency,
    setCurrency,
    createAccountMutation,
    handleCreateAccount,
    status,
    setStatus: handleStatusChange,
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
  }
}


