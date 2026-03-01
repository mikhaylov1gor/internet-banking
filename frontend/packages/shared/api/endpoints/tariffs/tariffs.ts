import { apiClient } from '../../client'
import type { CreditTariff, CreateTariffRequest, GetTariffsParams } from './types'

export const getTariffs = async (params?: GetTariffsParams): Promise<CreditTariff[]> => {
  const response = await apiClient.get<CreditTariff[]>('/tariffs', { params })
  return response.data
}

export const createTariff = async (data: CreateTariffRequest): Promise<CreditTariff> => {
  const response = await apiClient.post<CreditTariff>('/tariffs', data)
  return response.data
}
