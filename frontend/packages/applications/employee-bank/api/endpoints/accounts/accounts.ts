import { apiClient } from '../../client'
import type { Account, Operation, GetAccountsParams, GetOperationsParams, CreateAccountRequest } from './types'

export const getAccounts = async (params?: GetAccountsParams): Promise<Account[]> => {
  const response = await apiClient.get<Account[]>('/accounts', { params })
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

export const closeAccount = async (accountId: string): Promise<void> => {
  await apiClient.delete(`/accounts/${accountId}`)
}

export const getAccountOperations = async (accountId: string, params?: GetOperationsParams): Promise<Operation[]> => {
  const response = await apiClient.get<Operation[]>(`/accounts/${accountId}/operations`, { params })
  return response.data
}


