import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAccount, useAccountOperations } from '../../../features/accounts'

export const useAccountDetailPage = () => {
  const { accountId } = useParams<{ accountId: string }>()
  const navigate = useNavigate()
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

  const { data: account, isLoading: accountLoading, error: accountError } = useAccount(accountId || null)
  const { data: operationsResponse, isLoading: operationsLoading } = useAccountOperations(accountId || null, {
    page,
    page_size: pageSize,
  })

  const operations = useMemo(() => operationsResponse?.operations || [], [operationsResponse])
  const totalPages = useMemo(() => operationsResponse?.pageQuantity || 1, [operationsResponse])

  return {
    account,
    accountLoading,
    accountError,
    operations,
    operationsLoading,
    limit: pageSize,
    setLimit: setPageSize,
    page,
    setPage,
    totalPages,
    navigate,
  }
}


