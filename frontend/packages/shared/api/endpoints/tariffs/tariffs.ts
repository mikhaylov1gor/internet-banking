import { apiClient } from '../../http/http-client'
import { parseApiResponse } from '../../parse-response'
import {
  CreditTariffSchema,
  TariffListResponseSchema,
  type CreditTariff,
  type CreateTariffRequest,
  type GetTariffsParams,
  type TariffListResponse,
} from './types'

export const getTariffs = async (params?: GetTariffsParams): Promise<TariffListResponse> => {
  const { data } = await apiClient.get('/tariffs', { params })
  return parseApiResponse(TariffListResponseSchema, data)
}

export const createTariff = async (data: CreateTariffRequest): Promise<CreditTariff> => {
  const { data: body } = await apiClient.post('/tariffs', data)
  return parseApiResponse(CreditTariffSchema, body)
}
