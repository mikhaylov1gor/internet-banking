import { apiClient } from '../../client'
import { parseApiResponse } from '../../parse-response'
import {
  UserSchema,
  UserListResponseSchema,
  type User,
  type CreateUserRequest,
  type GetUsersParams,
  type UserListResponse,
  type RegisterPushDeviceRequest,
} from './types'

export const getUsers = async (params?: GetUsersParams): Promise<UserListResponse> => {
  const response = await apiClient.get('/users', { params })
  return parseApiResponse(UserListResponseSchema, response.data)
}

export const getUserById = async (userId: string): Promise<User> => {
  const response = await apiClient.get(`/users/${userId}`)
  return parseApiResponse(UserSchema, response.data)
}

export const createUser = async (data: CreateUserRequest): Promise<User> => {
  const response = await apiClient.post('/users', data)
  return parseApiResponse(UserSchema, response.data)
}

export const blockUser = async (userId: string): Promise<void> => {
  await apiClient.patch(`/users/${userId}`, null, { params: { action: 'block' } })
}

export const unblockUser = async (userId: string): Promise<void> => {
  await apiClient.patch(`/users/${userId}`, null, { params: { action: 'unblock' } })
}

export const registerPushDevice = async (data: RegisterPushDeviceRequest): Promise<void> => {
  await apiClient.post('/users/push/device', data)
}
