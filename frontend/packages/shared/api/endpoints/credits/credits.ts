import { apiClient } from '../../client'
import type { Credit, GetCreditsParams, IssueCreditRequest, RepayCreditRequest, CreditListResponse } from './types'

export const getCredits = async (params?: GetCreditsParams): Promise<CreditListResponse> => {
  const response = await apiClient.get<CreditListResponse>('/credits', { params })
  return response.data
}

export const getCreditById = async (creditId: string): Promise<Credit> => {
  const response = await apiClient.get<Credit>(`/credits/${creditId}`)
  return response.data
}

export const issueCredit = async (data: IssueCreditRequest): Promise<Credit> => {
  const response = await apiClient.post<Credit>('/credits', data)
  return response.data
}

export const repayCredit = async (creditId: string, data: RepayCreditRequest): Promise<Credit> => {
  const response = await apiClient.post<Credit>(`/credits/${creditId}/repay`, data)
  return response.data
}
