import { useParams, useNavigate } from 'react-router-dom'
import { useCredit } from '../../../features/credits'
import { useUser } from '../../../features/users'
import { useTariff } from '../../../features/tariffs'

export const useCreditDetailPage = () => {
  const { creditId } = useParams<{ creditId: string }>()
  const navigate = useNavigate()

  const { data: credit, isLoading: creditLoading, error: creditError } = useCredit(creditId || null)
  
  const { data: client, isLoading: clientLoading } = useUser(credit?.client_id || null)
  const { data: tariff, isLoading: tariffLoading } = useTariff(credit?.tariff_id || null)

  return {
    credit,
    creditLoading,
    creditError,
    client,
    clientLoading,
    tariff,
    tariffLoading,
    navigate,
  }
}


