import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import { Mail, Lock, User, Phone, Calendar, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/Toaster'

const schema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().optional(),
  dataNascimento: z.string().optional(),
  senha: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmarSenha: z.string(),
}).refine((data) => data.senha === data.confirmarSenha, {
  message: 'Senhas não conferem',
  path: ['confirmarSenha'],
})

type FormData = z.infer<typeof schema>

export default function Register() {
  const router = useRouter()
  const { register: registerUser } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: '', email: '', senha: '', confirmarSenha: '' },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await registerUser({
        nome: data.nome,
        email: data.email,
        senha: data.senha,
        telefone: data.telefone,
        dataNascimento: data.dataNascimento,
      })
      toast('Cadastro realizado com sucesso!', 'success')
      router.replace('/dashboard')
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Erro ao cadastrar.'
      toast(msg || 'Erro ao cadastrar.', 'error')
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
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        {particlesReady && (
          <Particles
            id="tsparticles-register"
            options={{
              fullScreen: { enable: false },
              particles: {
                number: { value: 40 },
                color: { value: ['#83a781', '#9bb999'] },
                opacity: { value: 0.35 },
                size: { value: { min: 1, max: 3 } },
                move: { enable: true, speed: 1.2 },
              },
              background: { color: 'transparent' },
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-premium opacity-90" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-bold text-white">Criar conta</h1>
          <p className="text-white/80 text-sm">Preencha seus dados</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card-glass p-6 rounded-3xl"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input {...register('nome')} placeholder="Seu nome" className="input-field pl-10" />
              </div>
              {errors.nome && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> {errors.nome.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input {...register('email')} type="email" placeholder="seu@email.com" className="input-field pl-10" />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone (opcional)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input {...register('telefone')} placeholder="(11) 99999-9999" className="input-field pl-10" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de nascimento (opcional)</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input {...register('dataNascimento')} type="date" className="input-field pl-10" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input {...register('senha')} type="password" placeholder="Mínimo 6 caracteres" className="input-field pl-10" />
              </div>
              {errors.senha && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> {errors.senha.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input {...register('confirmarSenha')} type="password" placeholder="Repita a senha" className="input-field pl-10" />
              </div>
              {errors.confirmarSenha && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> {errors.confirmarSenha.message}
                </p>
              )}
            </div>
            <motion.button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'Cadastrando...' : 'Cadastrar'}
              <ArrowRight className="h-5 w-5" />
            </motion.button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600">
            Já tem conta?{' '}
            <Link href="/auth/login" className="font-medium text-olive hover:underline">
              Entrar
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
