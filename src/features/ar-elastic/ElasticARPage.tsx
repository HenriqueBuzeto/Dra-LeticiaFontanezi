import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ElasticAROverlay } from './components/ElasticAROverlay'

export default function ElasticARPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-night-bg px-4 py-6 pb-24">
      <div className="max-w-2xl mx-auto">
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
          Ative a câmera, posicione o rosto e escolha a cor. Use o modo manual se a detecção falhar.
        </p>
        <ElasticAROverlay />
      </div>
    </div>
  )
}
