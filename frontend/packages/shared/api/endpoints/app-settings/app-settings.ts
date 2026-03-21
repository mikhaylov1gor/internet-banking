import { apiClient } from '../../client'
import { parseApiResponse } from '../../parse-response'
import { AppSettingsSchema, type AppSettings, type AppType, type UpdateAppSettingsRequest } from './types'

export const getAppSettings = async (appType: AppType): Promise<AppSettings> => {
  const response = await apiClient.get(`/app-settings/${appType}`)
  return parseApiResponse(AppSettingsSchema, response.data)
}

export const updateAppSettings = async (
  appType: AppType,
  data: UpdateAppSettingsRequest
): Promise<AppSettings> => {
  const response = await apiClient.put(`/app-settings/${appType}`, data)
  return parseApiResponse(AppSettingsSchema, response.data)
}
