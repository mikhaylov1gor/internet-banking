import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAccounts,
  getAccountById,
  createAccount,
  closeAccount,
  getAccountOperations,
  type GetAccountsParams,
  type GetOperationsParams,
  type CreateAccountRequest,
} from '@shared/api/endpoints/accounts'

export const useAccounts = (params?: GetAccountsParams) => {
  return useQuery({
    queryKey: ['accounts', params],
    queryFn: () => getAccounts(params),
  })
}

export const useAccount = (accountId: string | null) => {
  return useQuery({
    queryKey: ['account', accountId],
    queryFn: () => {
      if (!accountId) throw new Error('Account ID is required')
      return getAccountById(accountId)
    },
    enabled: !!accountId,
  })
}

export const useAccountOperations = (accountId: string | null, params?: GetOperationsParams) => {
  return useQuery({
    queryKey: ['account-operations', accountId, params],
    queryFn: () => {
      if (!accountId) throw new Error('Account ID is required')
      return getAccountOperations(accountId, params)
    },
    enabled: !!accountId,
  })
}

export const useCreateAccount = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAccountRequest) => createAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}

export const useCloseAccount = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ accountId, clientId }: { accountId: string; clientId: string }) => 
      closeAccount(accountId, clientId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['account', variables.accountId] })
      queryClient.invalidateQueries({ queryKey: ['account-operations', variables.accountId] })
    },
  })
}
