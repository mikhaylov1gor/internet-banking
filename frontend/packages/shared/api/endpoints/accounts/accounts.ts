import { apiClient } from '../../client'
import { parseApiResponse } from '../../parse-response'
import {
  AccountSchema,
  AccountBasicSchema,
  AccountListResponseSchema,
  OperationListResponseSchema,
  OperationSchema,
  TransferResponseSchema,
  TransferPreviewResponseSchema,
  type GetAccountsParams,
  type GetOperationsParams,
  type CreateAccountRequest,
  type ChangeBalanceRequest,
  type Account,
  type AccountBasic,
  type AccountListResponse,
  type OperationListResponse,
  type Operation,
  type TransferRequest,
  type TransferResponse,
  type TransferPreviewResponse,
} from './types'

export const getAccounts = async (params?: GetAccountsParams): Promise<AccountListResponse> => {
  const response = await apiClient.get('/accounts', { params })
  return parseApiResponse(AccountListResponseSchema, response.data)
}

export const getAccountById = async (accountId: string): Promise<Account> => {
  const response = await apiClient.get(`/accounts/${accountId}`)
  return parseApiResponse(AccountSchema, response.data)
}

export const getAccountBasicByNumber = async (accountNumberDigits: string): Promise<AccountBasic> => {
  const response = await apiClient.get(`/accounts/by-number/${encodeURIComponent(accountNumberDigits)}`)
  return parseApiResponse(AccountBasicSchema, response.data)
}

export const createAccount = async (data: CreateAccountRequest): Promise<Account> => {
  const response = await apiClient.post('/accounts', data)
  return parseApiResponse(AccountSchema, response.data)
}

export const closeAccount = async (accountId: string, clientId: string): Promise<void> => {
  await apiClient.delete(`/accounts/${accountId}`, {
    params: { client_id: clientId },
  })
}

export const getAccountOperations = async (
  accountId: string,
  params?: GetOperationsParams
): Promise<OperationListResponse> => {
  const response = await apiClient.get(`/accounts/${accountId}/operations`, { params })
  return parseApiResponse(OperationListResponseSchema, response.data)
}

export const depositToAccount = async (accountId: string, data: ChangeBalanceRequest): Promise<Operation> => {
  const response = await apiClient.post(`/accounts/${accountId}/deposit`, data)
  return parseApiResponse(OperationSchema, response.data)
}

export const withdrawFromAccount = async (accountId: string, data: ChangeBalanceRequest): Promise<Operation> => {
  const response = await apiClient.post(`/accounts/${accountId}/withdraw`, data)
  return parseApiResponse(OperationSchema, response.data)
}

export const transferBetweenAccounts = async (data: TransferRequest): Promise<TransferResponse> => {
  const body: Record<string, string | number> = {
    from_account_id: data.from_account_id,
    amount: data.amount,
  }
  if (data.to_account_id) {
    body.to_account_id = data.to_account_id
  }
  if (data.to_account_number) {
    body.to_account_number = data.to_account_number
  }
  const response = await apiClient.post('/accounts/transfer', body)
  return parseApiResponse(TransferResponseSchema, response.data)
}

export const previewTransferBetweenAccounts = async (data: TransferRequest): Promise<TransferPreviewResponse> => {
  const body: Record<string, string | number> = {
    from_account_id: data.from_account_id,
    amount: data.amount,
  }
  if (data.to_account_id) {
    body.to_account_id = data.to_account_id
  }
  if (data.to_account_number) {
    body.to_account_number = data.to_account_number
  }
  const response = await apiClient.post('/accounts/transfer/preview', body)
  return parseApiResponse(TransferPreviewResponseSchema, response.data)
}
