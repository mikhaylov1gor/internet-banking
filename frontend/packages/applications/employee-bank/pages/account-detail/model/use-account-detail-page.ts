import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAccount, useAccountOperations } from '../../../features/accounts'

export const useAccountDetailPage = () => {
  const { accountId } = useParams<{ accountId: string }>()
  const navigate = useNavigate()
  const [limit, setLimit] = useState(10)
  const [page, setPage] = useState(1)

  const { data: account, isLoading: accountLoading, error: accountError } = useAccount(accountId || null)
  const { data: operations, isLoading: operationsLoading } = useAccountOperations(accountId || null, {
    limit,
    offset: (page - 1) * limit,
  })

  return {
    account,
    accountLoading,
    accountError,
    operations,
    operationsLoading,
    limit,
    setLimit,
    page,
    setPage,
    navigate,
  }
}


