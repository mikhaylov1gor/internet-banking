import { apiClient } from '../../client'
import type { Credit, GetCreditsParams } from './types'

export const getCredits = async (params?: GetCreditsParams): Promise<Credit[]> => {
  const response = await apiClient.get<Credit[]>('/credits', { params })
  return response.data
}


