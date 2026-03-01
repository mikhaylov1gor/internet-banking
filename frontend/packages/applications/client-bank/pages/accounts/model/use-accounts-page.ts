import { useState } from 'react'
import { useAccounts, useCreateAccount } from '../../../features/accounts'
import { getCurrentUserId } from '@shared/features/auth'
import type { GetAccountsParams } from '@shared/api/endpoints/accounts'

export const useAccountsPage = () => {
  const [showModal, setShowModal] = useState(false)
  const [currency, setCurrency] = useState<'RUB' | 'USD' | 'EUR'>('RUB')
  const [status, setStatus] = useState<'active' | 'closed' | ''>('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const clientId = getCurrentUserId()

  const params: Omit<GetAccountsParams, 'client_id'> = {
    ...(status && { status: status as 'active' | 'closed' }),
    limit,
    offset: (page - 1) * limit,
  }

  const { data: accounts, isLoading } = useAccounts(params)
  const createAccountMutation = useCreateAccount()

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
      { client_id: clientId, currency },
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

  const totalPages = accounts 
    ? (accounts.length < limit ? page : page + 1)
    : 1

  return {
    accounts,
    isLoading,
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
    limit,
    setLimit,
    totalPages,
  }
}


