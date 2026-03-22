import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inlineHandledMutationMeta } from '@shared/features/app/model/inline-handled-mutation-meta'
import {
  getAccounts,
  getAccountById,
  getAccountBasicByNumber,
  createAccount,
  closeAccount,
  getAccountOperations,
  depositToAccount,
  withdrawFromAccount,
  transferBetweenAccounts,
  previewTransferBetweenAccounts,
  type GetAccountsParams,
  type GetOperationsParams,
  type CreateAccountRequest,
  type ChangeBalanceRequest,
  type TransferRequest,
} from '@shared/api/endpoints/accounts'
import { getCurrentUserId } from '@shared/features/auth'

export const useAccounts = (params?: Omit<GetAccountsParams, 'client_id'>) => {
  const clientId = getCurrentUserId()
  return useQuery({
    queryKey: ['accounts', { ...params, client_id: clientId }],
    queryFn: () => getAccounts({ ...params, client_id: clientId || undefined }),
    enabled: !!clientId,
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

export const useAccountBasicByNumber = (digits: string | null) => {
  return useQuery({
    queryKey: ['account-basic-by-number', digits],
    queryFn: () => getAccountBasicByNumber(digits!),
    enabled: digits !== null && digits.length === 16,
    retry: false,
    staleTime: 60_000,
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
  const clientId = getCurrentUserId()

  return useMutation({
    meta: { ...inlineHandledMutationMeta },
    mutationFn: (data: Omit<CreateAccountRequest, 'client_id'>) => {
      if (!clientId) {
        throw new Error('User ID is required')
      }
      return createAccount({ ...data, client_id: clientId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}

export const useCloseAccount = () => {
  const queryClient = useQueryClient()
  const clientId = getCurrentUserId()

  return useMutation({
    mutationFn: (accountId: string) => {
      if (!clientId) {
        throw new Error('User ID is required')
      }
      return closeAccount(accountId, clientId)
    },
    onSuccess: (_, accountId) => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['account', accountId] })
      queryClient.invalidateQueries({ queryKey: ['account-operations', accountId] })
    },
  })
}

export const useDepositToAccount = () => {
  const queryClient = useQueryClient()

  return useMutation({
    meta: { ...inlineHandledMutationMeta },
    mutationFn: ({ accountId, data }: { accountId: string; data: ChangeBalanceRequest }) =>
      depositToAccount(accountId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['account', variables.accountId] })
      queryClient.invalidateQueries({ queryKey: ['account-operations', variables.accountId] })
    },
  })
}

export const useWithdrawFromAccount = () => {
  const queryClient = useQueryClient()

  return useMutation({
    meta: { ...inlineHandledMutationMeta },
    mutationFn: ({ accountId, data }: { accountId: string; data: ChangeBalanceRequest }) =>
      withdrawFromAccount(accountId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['account', variables.accountId] })
      queryClient.invalidateQueries({ queryKey: ['account-operations', variables.accountId] })
    },
  })
}

export const useTransferBetweenAccounts = () => {
  const queryClient = useQueryClient()

  return useMutation({
    meta: { ...inlineHandledMutationMeta },
    mutationFn: (data: TransferRequest) => transferBetweenAccounts(data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['account', variables.from_account_id] })
      queryClient.invalidateQueries({ queryKey: ['account-operations', variables.from_account_id] })
      const creditAccId = data.credit_operation.account_id
      queryClient.invalidateQueries({ queryKey: ['account', creditAccId] })
      queryClient.invalidateQueries({ queryKey: ['account-operations', creditAccId] })
    },
  })
}

export const useTransferPreview = (params: TransferRequest | null) => {
  return useQuery({
    queryKey: [
      'transfer-preview',
      params?.from_account_id,
      params?.to_account_id ?? '',
      params?.to_account_number ?? '',
      params?.amount,
    ],
    queryFn: () => {
      if (!params) {
        throw new Error('Preview params required')
      }
      return previewTransferBetweenAccounts(params)
    },
    enabled: !!params,
    staleTime: 15_000,
  })
}


