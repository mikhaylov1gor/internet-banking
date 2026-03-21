import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAccountOperationsWsSync } from '@shared/features/accounts'
import { useAccount, useAccountOperations } from '../../../features/accounts'

const OPERATIONS_PAGE_SIZE = 10

export const useAccountDetailPage = () => {
  const { accountId } = useParams<{ accountId: string }>()
  const navigate = useNavigate()
  const [operationsPage, setOperationsPage] = useState(1)

  useEffect(() => {
    setOperationsPage(1)
  }, [accountId])

  useAccountOperationsWsSync(accountId || null, OPERATIONS_PAGE_SIZE)

  const { data: account, isLoading: accountLoading, error: accountError } = useAccount(accountId || null)

  const {
    data: operationsData,
    isLoading: operationsLoading,
    isError: operationsError,
    error: operationsFetchError,
  } = useAccountOperations(accountId || null, {
    page: operationsPage,
    page_size: OPERATIONS_PAGE_SIZE,
  })

  const operations = operationsData?.operations ?? []
  const operationsTotalPages = Math.max(operationsData?.pageQuantity ?? 1, 1)

  const goPrevOperationsPage = () => setOperationsPage((p) => Math.max(1, p - 1))
  const goNextOperationsPage = () =>
    setOperationsPage((p) => Math.min(operationsTotalPages, p + 1))

  return {
    account,
    accountLoading,
    accountError,
    operations,
    operationsLoading,
    operationsError,
    operationsFetchError,
    operationsPage,
    operationsTotalPages,
    goPrevOperationsPage,
    goNextOperationsPage,
    navigate,
  }
}
