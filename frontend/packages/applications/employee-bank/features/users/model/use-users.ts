import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inlineHandledMutationMeta } from '@shared/features/app/model/inline-handled-mutation-meta'
import {
  getUsers,
  getUserById,
  createUser,
  blockUser,
  unblockUser,
  type GetUsersParams,
  type CreateUserRequest,
} from '@shared/api/endpoints/users'

export const useUsers = (params?: GetUsersParams) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => getUsers(params),
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  })
}

export const useUser = (userId: string | null) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => {
      if (!userId) throw new Error('User ID is required')
      return getUserById(userId)
    },
    enabled: !!userId,
  })
}

export const useCreateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    meta: { ...inlineHandledMutationMeta },
    mutationFn: (data: CreateUserRequest) => createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export const useToggleUserStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, action }: { userId: string; action: 'block' | 'unblock' }) => {
      return action === 'block' ? blockUser(userId) : unblockUser(userId)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] })
    },
  })
}

export const verifyUserExistsForNavigation = (userId: string) => getUserById(userId)

