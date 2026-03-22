import { apiClient } from '../../http/http-client'
import { parseApiResponse } from '../../parse-response'
import {
  CreditRatingSchema,
  CreditSchema,
  CreditListResponseSchema,
  CreditPaymentListResponseSchema,
  CreditAvailabilitySchema,
  type CreditRating,
  type Credit,
  type GetCreditsParams,
  type CreditListResponse,
  type IssueCreditRequest,
  type RepayCreditRequest,
  type GetCreditPaymentsParams,
  type CreditPaymentListResponse,
  type CreditAvailability,
} from './types'

export const getClientCreditRating = async (clientId: string): Promise<CreditRating> => {
  const { data } = await apiClient.get(`/clients/${clientId}/credit-rating`)
  return parseApiResponse(CreditRatingSchema, data)
}

export const getCredits = async (params?: GetCreditsParams): Promise<CreditListResponse> => {
  const { data } = await apiClient.get('/credits', { params })
  return parseApiResponse(CreditListResponseSchema, data)
}

export const getCreditById = async (creditId: string): Promise<Credit> => {
  const { data } = await apiClient.get(`/credits/${creditId}`)
  return parseApiResponse(CreditSchema, data)
}

export const issueCredit = async (data: IssueCreditRequest): Promise<Credit> => {
  const { data: body } = await apiClient.post('/credits', data)
  return parseApiResponse(CreditSchema, body)
}

export const checkCreditAvailability = async (amount: number): Promise<CreditAvailability> => {
  const { data } = await apiClient.post('/credits/availability', { amount })
  return parseApiResponse(CreditAvailabilitySchema, data)
}

export const repayCredit = async (creditId: string, data: RepayCreditRequest): Promise<Credit> => {
  const { data: body } = await apiClient.post(`/credits/${creditId}/repay`, data)
  return parseApiResponse(CreditSchema, body)
}

export const getCreditPayments = async (
  creditId: string,
  params?: GetCreditPaymentsParams
): Promise<CreditPaymentListResponse> => {
  const { data } = await apiClient.get(`/credits/${creditId}/payments`, {
    params: {
      page: params?.page,
      page_size: params?.page_size,
      ...(params?.only_overdue ? { only_overdue: true } : {}),
    },
  })
  return parseApiResponse(CreditPaymentListResponseSchema, data)
}
