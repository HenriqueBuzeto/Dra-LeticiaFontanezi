import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ArSimulator } from './components/ArSimulator'

export default function ElasticARPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-night-bg px-4 py-6 pb-24">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm font-medium text-olive dark:text-accent-purpleLight mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Link>
        <h1 className="text-xl font-bold text-gray-800 dark:text-night-text mb-2">
          Simulador AR – Borrachinhas
        </h1>
        <p className="text-sm text-gray-600 dark:text-night-muted mb-6">
          Escolha uma foto ou ative a câmera para simular diferentes cores de borrachinhas ortodônticas em tempo real.
        </p>
        <ArSimulator />
      </div>
    </div>
  )
}

