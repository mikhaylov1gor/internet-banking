import { apiClient } from '../../client'
import type { Account, Operation, GetAccountsParams, GetOperationsParams, CreateAccountRequest, ChangeBalanceRequest, AccountListResponse, OperationListResponse } from './types'

export const getAccounts = async (params?: GetAccountsParams): Promise<AccountListResponse> => {
  const response = await apiClient.get<AccountListResponse>('/accounts', { params })
  return response.data
}

export const getAccountById = async (accountId: string): Promise<Account> => {
  const response = await apiClient.get<Account>(`/accounts/${accountId}`)
  return response.data
}

export const createAccount = async (data: CreateAccountRequest): Promise<Account> => {
  const response = await apiClient.post<Account>('/accounts', data)
  return response.data
}

export const closeAccount = async (accountId: string, clientId: string): Promise<void> => {
  await apiClient.delete(`/accounts/${accountId}`, {
    params: { client_id: clientId },
  })
}

export const getAccountOperations = async (accountId: string, params?: GetOperationsParams): Promise<OperationListResponse> => {
  const response = await apiClient.get<OperationListResponse>(`/accounts/${accountId}/operations`, { params })
  return response.data
}

export const depositToAccount = async (accountId: string, data: ChangeBalanceRequest): Promise<Operation> => {
  const response = await apiClient.post<Operation>(`/accounts/${accountId}/deposit`, data)
  return response.data
}

export const withdrawFromAccount = async (accountId: string, data: ChangeBalanceRequest): Promise<Operation> => {
  const response = await apiClient.post<Operation>(`/accounts/${accountId}/withdraw`, data)
  return response.data
}
