import { Component, type ReactNode } from 'react'
import Link from 'next/link'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ARSimulatorErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-night-bg flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <h1 className="text-lg font-bold text-gray-800 dark:text-night-text mb-2">
              Erro no Simulador AR
            </h1>
            <p className="text-sm text-gray-600 dark:text-night-muted mb-4">
              {this.state.error?.message ?? 'Algo deu errado.'}
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-olive text-white font-medium"
            >
              Voltar ao início
            </Link>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
