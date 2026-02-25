'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/Toaster'
import { getApiErrorMessage } from '@/lib/apiError'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type FormData = z.infer<typeof schema>

const DENTIST_IMAGE = 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&q=80'

export default function Login() {
  const router = useRouter()
  const { login } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const user = await login(data.email, data.password)
      toast('Login realizado com sucesso!', 'success')
      router.replace(user?.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Erro ao fazer login.')
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const [particlesReady, setParticlesReady] = useState(false)
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => setParticlesReady(true))
  }, [])

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } } }
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile: hero mais alto + gradiente suave + partículas */}
      <div className="md:hidden h-52 sm:h-64 relative overflow-hidden shrink-0">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: `url(${DENTIST_IMAGE})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-olive/85 to-olive/75" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        {particlesReady && (
          <Particles
            id="tsparticles-login-mobile"
            className="absolute inset-0"
            options={{
              fullScreen: { enable: false },
              particles: {
                number: { value: 28 },
                color: { value: ['#ffffff', '#E0E5E9'] },
                opacity: { value: { min: 0.2, max: 0.45 } },
                size: { value: { min: 1, max: 2.5 } },
                move: { enable: true, speed: { min: 0.3, max: 1 } },
              },
              background: { color: 'transparent' },
            }}
          />
        )}
        <div className="absolute inset-0 flex flex-col justify-end p-5 pb-7 text-white">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-sm font-medium text-white/90 uppercase tracking-widest"
          >
            Ortodontia Premium
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="text-2xl font-bold tracking-tight drop-shadow-sm"
          >
            Dra. Letícia Fontanezi
          </motion.p>
        </div>
      </div>

      {/* Lado esquerdo (desktop): imagem + gradiente + partículas */}
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${DENTIST_IMAGE})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-olive/95 via-olive/80 to-olive-dark/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        {particlesReady && (
          <Particles
            id="tsparticles-login"
            className="absolute inset-0"
            options={{
              fullScreen: { enable: false },
              particles: {
                number: { value: 80 },
                color: { value: ['#ffffff', '#E0E5E9', '#a5f3fc'] },
                opacity: { value: { min: 0.2, max: 0.6 } },
                size: { value: { min: 1, max: 4 } },
                move: {
                  enable: true,
                  speed: { min: 0.5, max: 2 },
                  direction: 'none',
                  random: true,
                  outModes: { default: 'bounce' },
                },
              },
              interactivity: {
                detect_on: 'canvas',
                events: {
                  onHover: { enable: true, mode: 'grab' },
                },
                modes: { grab: { distance: 140, links: { opacity: 0.4 } } },
              },
              background: { color: 'transparent' },
            }}
          />
        )}
        <div className="relative z-10 flex flex-col justify-end p-8 lg:p-12 text-white">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-lg font-medium text-white/90 max-w-sm"
          >
            Cuidando do seu sorriso com tecnologia e humanização.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-2xl lg:text-3xl font-bold mt-2"
          >
            Dra. Letícia Fontanezi
          </motion.p>
          <p className="text-white/70 text-sm mt-1">Ortodontia &amp; Odontologia Premium</p>
        </div>
      </div>

      {/* Lado direito: formulário — mobile = card flutuante; desktop = layout normal */}
      <div className="flex-1 flex flex-col md:justify-center px-0 md:px-6 sm:px-10 lg:px-16 py-0 md:py-12 bg-transparent md:bg-white">
        <div className="w-full max-w-md mx-auto flex-1 md:flex-none flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="auth-mobile-card -mt-6 md:mt-0 flex-1 px-5 pt-6 pb-10 md:px-0 md:pt-0 md:pb-0 md:rounded-none md:shadow-none"
          >
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="md:block"
            >
              <motion.div variants={item} className="md:hidden mb-1">
                <p className="text-xs font-medium text-olive uppercase tracking-wider">Sistema Odontológico</p>
              </motion.div>
              <motion.h2 variants={item} className="text-2xl sm:text-3xl font-bold text-gray-900 mt-0 md:mt-0">
                Bem-vindo
              </motion.h2>
              <motion.p variants={item} className="text-gray-500 mt-1 mb-6 md:mb-8 text-sm sm:text-base">
                Entre na sua conta para continuar
              </motion.p>

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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                    <input
                      {...register('password')}
                      type="password"
                      placeholder="••••••••"
                      className="auth-input md:input-field md:pl-10"
                      autoComplete="current-password"
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {errors.password.message}
                    </p>
                  )}
                </motion.div>
                <motion.div variants={item} className="text-right">
                  <Link href="/auth/forgot-password" className="text-sm font-medium text-olive hover:underline focus:outline-none focus:ring-2 focus:ring-olive/30 rounded">
                    Esqueci minha senha
                  </Link>
                </motion.div>
                <motion.div variants={item}>
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="auth-btn-mobile md:btn-primary w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-base font-semibold text-white"
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? 'Entrando...' : 'Entrar'}
                    <ArrowRight className="h-5 w-5" />
                  </motion.button>
                </motion.div>
              </form>

              <motion.p variants={item} className="mt-6 md:mt-8 text-center text-sm text-gray-500">
                Não tem conta?{' '}
                <Link href="/auth/register" className="font-semibold text-olive hover:underline focus:outline-none focus:ring-2 focus:ring-olive/30 rounded">
                  Cadastre-se
                </Link>
              </motion.p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
