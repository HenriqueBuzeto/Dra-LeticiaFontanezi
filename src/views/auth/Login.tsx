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

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile: faixa superior com imagem + gradiente + partículas */}
      <div className="md:hidden h-48 sm:h-56 relative overflow-hidden shrink-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${DENTIST_IMAGE})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-olive/90 via-olive/70 to-offwhite" />
        {particlesReady && (
          <Particles
            id="tsparticles-login-mobile"
            className="absolute inset-0"
            options={{
              fullScreen: { enable: false },
              particles: {
                number: { value: 60 },
                color: { value: ['#ffffff', '#E0E5E9'] },
                opacity: { value: { min: 0.2, max: 0.5 } },
                size: { value: { min: 1, max: 3 } },
                move: { enable: true, speed: 1 },
              },
              background: { color: 'transparent' },
            }}
          />
        )}
        <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
          <p className="text-lg font-bold">Dra. Letícia Fontanezi</p>
          <p className="text-sm text-white/80">Ortodontia Premium</p>
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

      {/* Lado direito: formulário */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-12 bg-white">
        <div className="w-full max-w-md mx-auto">
          {/* Em mobile: título da clínica no topo */}
          <div className="md:hidden text-center mb-8">
            <h1 className="text-xl font-bold text-olive">Dra. Letícia Fontanezi</h1>
            <p className="text-sm text-gray-500">Sistema Odontológico</p>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Bem-vindo</h2>
            <p className="text-gray-500 mt-1 mb-8">Entre na sua conta para continuar</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="seu@email.com"
                    className="input-field pl-10"
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('password')}
                    type="password"
                    placeholder="••••••••"
                    className="input-field pl-10"
                    autoComplete="current-password"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div className="text-right">
                <Link href="/auth/forgot-password" className="text-sm text-olive hover:underline">
                  Esqueci minha senha
                </Link>
              </div>
              <motion.button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-base"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? 'Entrando...' : 'Entrar'}
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-500">
              Não tem conta?{' '}
              <Link href="/auth/register" className="font-medium text-olive hover:underline">
                Cadastre-se
              </Link>
            </p>

          </motion.div>
        </div>
      </div>
    </div>
  )
}
