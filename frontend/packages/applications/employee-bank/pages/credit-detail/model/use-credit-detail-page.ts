import { useParams, useNavigate } from 'react-router-dom'
import { useCredit } from '../../../features/credits'

export const useCreditDetailPage = () => {
  const { creditId } = useParams<{ creditId: string }>()
  const navigate = useNavigate()

  const { data: credit, isLoading: creditLoading, error: creditError } = useCredit(creditId || null)

  return {
    credit,
    creditLoading,
    creditError,
    navigate,
  }
}


