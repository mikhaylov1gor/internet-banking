export type User = {
  id: string
  type: 'client' | 'employee'
  email: string
  full_name?: string
  phone?: string
  status: 'active' | 'blocked'
  created_at: string
}

export type CreateUserRequest = {
  type: 'client' | 'employee'
  email: string
  full_name: string
  phone?: string
  password?: string
}

export type UserListResponse = {
  users: User[]
  pageNumber: number
  pageQuantity: number
}

export type GetUsersParams = {
  type?: 'client' | 'employee'
  status?: 'active' | 'blocked'
  page?: number
  page_size?: number
}
