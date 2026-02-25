import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'

export default function ForgotPassword() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white dark:bg-night-bg">
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-olive/15 dark:bg-olive/25 flex items-center justify-center mx-auto mb-6">
          <Mail className="h-7 w-7 text-olive dark:text-olive-light" />
        </div>
        <h1 className="text-xl font-bold text-gray-800 dark:text-night-text">Esqueci minha senha</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-night-muted">
          Entre em contato com a clínica pelo WhatsApp ou telefone para redefinir sua senha com segurança.
        </p>
        <Link
          href="/auth/login"
          className="mt-6 inline-flex items-center gap-2 text-olive dark:text-olive-light font-medium hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao login
        </Link>
      </div>
    </div>
  )
}
