'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'
import { useToast } from '@/components/ui/Toaster'
import { getApiErrorMessage } from '@/lib/apiError'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
})

type FormData = z.infer<typeof schema>

const DENTIST_IMAGE = 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&q=80'

export default function ForgotPassword() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [particlesReady, setParticlesReady] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => setParticlesReady(true))
  }, [])

  const onSubmit = async (data: FormData) => {
    if (!isSupabaseConfigured() || !supabase) {
      toast('Redefinição de senha não disponível. Entre em contato com a clínica pelo WhatsApp.', 'error')
      return
    }
    setLoading(true)
    setSent(false)
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${origin}/auth/reset-password`,
      })
      if (error) throw error
      setSent(true)
      toast('Se o e-mail existir, você receberá um link para redefinir a senha.', 'success')
    } catch (err: unknown) {
      toast(getApiErrorMessage(err, 'Erro ao enviar e-mail. Tente novamente.'), 'error')
    } finally {
      setLoading(false)
    }
  }

  // Sem Supabase configurado (falta NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local): mensagem manual
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-offwhite dark:bg-night-bg">
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
            className="mt-6 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-olive/10 text-olive dark:text-olive-light font-medium hover:bg-olive/20 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao login
          </Link>
        </div>
      </div>
    )
  }

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.08 } } }
  const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile: hero + card flutuante (igual Login/Register) */}
      <div className="md:hidden h-52 sm:h-64 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-cover bg-center scale-105" style={{ backgroundImage: `url(${DENTIST_IMAGE})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-olive/85 to-olive/75" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        {particlesReady && (
          <Particles
            id="tsparticles-forgot-mobile"
            className="absolute inset-0"
            options={{
              fullScreen: { enable: false },
              particles: { number: { value: 28 }, color: { value: ['#ffffff', '#E0E5E9'] }, opacity: { value: { min: 0.2, max: 0.45 } }, size: { value: { min: 1, max: 2.5 } }, move: { enable: true, speed: { min: 0.3, max: 1 } } },
              background: { color: 'transparent' },
            }}
          />
        )}
        <div className="absolute inset-0 flex flex-col justify-end p-5 pb-7 text-white">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }} className="text-sm font-medium text-white/90 uppercase tracking-widest">Ortodontia Premium</motion.p>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.4 }} className="text-2xl font-bold tracking-tight drop-shadow-sm">Dra. Letícia Fontanezi</motion.p>
        </div>
      </div>

      {/* Desktop: lado esquerdo */}
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${DENTIST_IMAGE})` }} />
        <div className="absolute inset-0 bg-gradient-to-br from-olive/95 via-olive/80 to-olive-dark/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        {particlesReady && (
          <Particles
            id="tsparticles-forgot"
            className="absolute inset-0"
            options={{
              fullScreen: { enable: false },
              particles: { number: { value: 80 }, color: { value: ['#ffffff', '#E0E5E9'] }, opacity: { value: { min: 0.2, max: 0.6 } }, size: { value: { min: 1, max: 4 } }, move: { enable: true, speed: 1 } },
              background: { color: 'transparent' },
            }}
          />
        )}
        <div className="relative z-10 flex flex-col justify-end p-8 lg:p-12 text-white">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-lg font-medium text-white/90 max-w-sm">
            Cuidando do seu sorriso com tecnologia e humanização.
          </motion.p>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="text-2xl lg:text-3xl font-bold mt-2">Dra. Letícia Fontanezi</motion.p>
          <p className="text-white/70 text-sm mt-1">Ortodontia &amp; Odontologia Premium</p>
        </div>
      </div>

      {/* Lado direito: formulário — mobile = card flutuante */}
      <div className="flex-1 flex flex-col md:justify-center px-0 md:px-6 sm:px-10 lg:px-16 py-0 md:py-12 bg-transparent md:bg-white">
        <div className="w-full max-w-md mx-auto flex-1 md:flex-none flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="auth-mobile-card -mt-6 md:mt-0 flex-1 px-5 pt-6 pb-10 md:px-0 md:pt-0 md:pb-0 md:rounded-none md:shadow-none"
          >
            <motion.div variants={container} initial="hidden" animate="show">
              <div className="md:hidden mb-1">
                <p className="text-xs font-medium text-olive uppercase tracking-wider">Sistema Odontológico</p>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-900">Esqueci minha senha</h2>
              <p className="text-gray-500 mt-1 mb-6 md:mb-8 text-sm sm:text-base">Informe seu e-mail e enviaremos um link para redefinir a senha.</p>

              {sent ? (
                <motion.div variants={item} className="rounded-2xl bg-olive/10 dark:bg-olive/20 border border-olive/20 p-6 flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-olive shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-800">E-mail enviado</p>
                    <p className="text-sm text-gray-600 dark:text-gray-600 mt-1">Verifique sua caixa de entrada (e a pasta de spam) e clique no link para criar uma nova senha.</p>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-5">
                  <motion.div variants={item}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                      <input
                        {...register('email')}
                        type="email"
                        placeholder="seu@email.com"
                        className="auth-input md:input-field md:pl-10"
                        autoComplete="email"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {errors.email.message}
                      </p>
                    )}
                  </motion.div>
                  <motion.div variants={item}>
                    <motion.button
                      type="submit"
                      disabled={loading}
                      className="auth-btn-mobile md:btn-primary w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-base font-semibold text-white"
                      whileTap={{ scale: 0.98 }}
                    >
                      {loading ? 'Enviando...' : 'Enviar link de redefinição'}
                    </motion.button>
                  </motion.div>
                </form>
              )}

              <motion.div variants={item}>
                <Link href="/auth/login" className="mt-6 md:mt-8 inline-flex items-center gap-2 text-sm text-olive dark:text-olive font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-olive/30 rounded">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao login
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
