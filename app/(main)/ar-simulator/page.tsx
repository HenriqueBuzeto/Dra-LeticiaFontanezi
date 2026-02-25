'use client'

import { lazy, Suspense } from 'react'
import Link from 'next/link'
import { ARSimulatorErrorBoundary } from '@/components/ARSimulatorErrorBoundary'

const LazyARSimulatorPage = lazy(() =>
  import('@/features/ar-elastic').then((m) => ({ default: m.ElasticARPage }))
)

function ARSimulatorLoadError() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-lg font-bold text-gray-800 dark:text-night-text mb-2">Simulador AR</h1>
        <p className="text-sm text-gray-600 dark:text-night-muted mb-4">
          Não foi possível carregar esta página. Tente recarregar ou volte ao início.
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

export default function ARSimulatorPage() {
  return (
    <ARSimulatorErrorBoundary>
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8 min-h-[40vh]">
            <span className="text-gray-500">Carregando Simulador AR...</span>
          </div>
        }
      >
        <LazyARSimulatorPage />
      </Suspense>
    </ARSimulatorErrorBoundary>
  )
}
