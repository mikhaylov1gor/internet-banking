import { ErrorFallback } from '@shared/ui/error-fallback'
import { useNotFoundPage } from '../model/use-not-found-page'
import './not-found-page.css'

export const NotFoundPage = () => {
  const { goBack, goBackLabel } = useNotFoundPage()

  return (
    <div className="not-found-page-container">
      <ErrorFallback
        title="Страница не найдена"
        message="Запрашиваемая страница не существует"
        onGoBack={goBack}
        goBackLabel={goBackLabel}
      />
    </div>
  )
}
