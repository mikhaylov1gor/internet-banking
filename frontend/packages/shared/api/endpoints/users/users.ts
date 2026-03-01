import { apiClient } from '../../client'
import type { User, CreateUserRequest, GetUsersParams } from './types'

export const getUsers = async (params?: GetUsersParams): Promise<User[]> => {
  const response = await apiClient.get<User[]>('/users', { params })
  return response.data
}

export const getUserById = async (userId: string): Promise<User> => {
  const response = await apiClient.get<User>(`/users/${userId}`)
  return response.data
}

export const createUser = async (data: CreateUserRequest): Promise<User> => {
  const response = await apiClient.post<User>('/users', data)
  return response.data
}

export const blockUser = async (userId: string): Promise<void> => {
  await apiClient.patch(`/users/${userId}`, null, { params: { action: 'block' } })
}

export const unblockUser = async (userId: string): Promise<void> => {
  await apiClient.patch(`/users/${userId}`, null, { params: { action: 'unblock' } })
}
