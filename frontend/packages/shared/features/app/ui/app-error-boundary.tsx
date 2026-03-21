import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorFallback } from '@shared/ui/error-fallback'

type Props = { children: ReactNode }

type State = {
  hasError: boolean
  message: string
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error, info.componentStack)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          title="Что-то пошло не так"
          message={this.state.message || 'Произошла непредвиденная ошибка'}
          onGoBack={() => window.location.reload()}
          goBackLabel="Обновить страницу"
        />
      )
    }
    return this.props.children
  }
}
