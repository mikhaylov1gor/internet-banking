import { z } from 'zod'

const UserTypeSchema = z.enum(['client', 'employee'])
const UserStatusSchema = z.enum(['active', 'blocked'])

export const UserSchema = z.object({
  id: z.string(),
  type: UserTypeSchema,
  email: z.string(),
  full_name: z.string().nullish(),
  phone: z.string().nullish(),
  status: UserStatusSchema,
  created_at: z.string(),
})
export type User = z.infer<typeof UserSchema>

export type CreateUserRequest = {
  type: 'client' | 'employee'
  email: string
  full_name: string
  phone?: string
  password?: string
}

export const UserListResponseSchema = z
  .object({
    users: z.array(UserSchema),
    page_number: z.number(),
    page_quantity: z.number(),
  })
  .transform((data) => ({
    users: data.users,
    pageNumber: data.page_number,
    pageQuantity: data.page_quantity,
  }))

export type UserListResponse = z.infer<typeof UserListResponseSchema>

export type GetUsersParams = {
  type?: 'client' | 'employee'
  status?: 'active' | 'blocked'
  page?: number
  page_size?: number
}
