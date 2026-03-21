import { useNavigate } from 'react-router-dom'
import { Button } from '@shared/ui/button'

export type HomeDashboardProps = {
  titleClassName?: string
  buttonsRowClassName?: string
  buttonClassName?: string
}

export const HomeDashboard = ({
  titleClassName,
  buttonsRowClassName,
  buttonClassName,
}: HomeDashboardProps) => {
  const navigate = useNavigate()

  return (
    <>
      <h1 className={`home-page-title ${titleClassName ?? ''}`.trim()}>Z-Банк</h1>
      <div className={`home-page-buttons ${buttonsRowClassName ?? ''}`.trim()}>
        <Button className={buttonClassName} onClick={() => navigate('/accounts')}>
          Мои счета
        </Button>
        <Button className={buttonClassName} onClick={() => navigate('/transfer')}>
          Перевод
        </Button>
        <Button className={buttonClassName} onClick={() => navigate('/credits')}>
          Мои кредиты
        </Button>
      </div>
    </>
  )
}
