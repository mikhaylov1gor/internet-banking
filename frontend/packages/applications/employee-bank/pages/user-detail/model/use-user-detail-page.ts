import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser, useToggleUserStatus } from '../../../features/users'
import { useCredits } from '../../../features/credits'

export const useUserDetailPage = () => {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const { data: user, isLoading: userLoading, error: userError } = useUser(userId || null)
  const { data: credits, isLoading: creditsLoading } = useCredits({
    client_id: user?.id || '',
    limit,
    offset: (page - 1) * limit,
  })
  const toggleStatusMutation = useToggleUserStatus()

  const handleToggleStatus = () => {
    if (user) {
      toggleStatusMutation.mutate({
        userId: user.id,
        action: user.status === 'active' ? 'block' : 'unblock',
      })
    }
  }

  const totalPages = Math.ceil((credits?.length || 0) / limit) || 1

  return {
    user,
    userLoading,
    userError,
    credits,
    creditsLoading,
    page,
    setPage,
    limit,
    setLimit,
    toggleStatusMutation,
    handleToggleStatus,
    totalPages,
    navigate,
  }
}


