import { useState, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useUser, useToggleUserStatus } from '../../../features/users'
import { useCredits, useClientCreditRatingForUser } from '../../../features/credits'

export const useUserDetailPage = () => {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo = (location.state as { returnTo?: string })?.returnTo

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [showRatingModal, setShowRatingModal] = useState(false)

  const { data: user, isLoading: userLoading, error: userError } = useUser(userId || null)
  const { data: creditsResponse, isLoading: creditsLoading, isError: creditsLoadError } = useCredits(
    {
      client_id: user?.id || '',
      page,
      page_size: limit,
    },
    {
      enabled: !!user?.id,
    }
  )
  const toggleStatusMutation = useToggleUserStatus()

  const ratingQueryEnabled = showRatingModal && !!userId && user?.type === 'client'
  const { data: creditRating, isLoading: ratingLoading, isError: ratingError } =
    useClientCreditRatingForUser(userId, { enabled: ratingQueryEnabled })

  const openRatingModal = useCallback(() => setShowRatingModal(true), [])
  const closeRatingModal = useCallback(() => setShowRatingModal(false), [])

  const handleToggleStatus = () => {
    if (user) {
      toggleStatusMutation.mutate({
        userId: user.id,
        action: user.status === 'active' ? 'block' : 'unblock',
      })
    }
  }

  const credits = creditsResponse?.credits || []
  const totalPages = creditsResponse?.pageQuantity || 1

  return {
    user,
    userLoading,
    userError,
    credits,
    creditsLoading,
    creditsLoadError,
    page,
    setPage,
    limit,
    setLimit,
    toggleStatusMutation,
    handleToggleStatus,
    totalPages,
    navigate,
    returnTo,
    showRatingModal,
    openRatingModal,
    closeRatingModal,
    creditRating,
    ratingLoading,
    ratingError,
  }
}
