'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, ArrowRight, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/ui/Toaster'
import { getApiErrorMessage } from '@/lib/apiError'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

const schema = z.object({
  senha: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmarSenha: z.string(),
}).refine((d) => d.senha === d.confirmarSenha, { message: 'Senhas não conferem', path: ['confirmarSenha'] })

type FormData = z.infer<typeof schema>

export default function ResetPassword() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { senha: '', confirmarSenha: '' },
  })

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      router.replace('/auth/login')
      return
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/auth/login')
      else setReady(true)
    })
  }, [router])

  const onSubmit = async (data: FormData) => {
    if (!supabase) return
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: data.senha })
      if (error) throw error
      toast('Senha alterada com sucesso. Faça login.', 'success')
      await supabase.auth.signOut()
      router.replace('/auth/login')
    } catch (err: unknown) {
      toast(getApiErrorMessage(err, 'Erro ao alterar senha.'), 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!ready) return null

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white dark:bg-night-bg">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-bold text-gray-800 dark:text-night-text">Nova senha</h1>
        <p className="text-sm text-gray-500 dark:text-night-muted mt-1 mb-6">Defina uma nova senha para acessar sua conta.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nova senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input {...register('senha')} type="password" placeholder="Mínimo 6 caracteres" className="input-field pl-10" autoComplete="new-password" />
            </div>
            {errors.senha && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {errors.senha.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirmar senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input {...register('confirmarSenha')} type="password" placeholder="Repita a senha" className="input-field pl-10" autoComplete="new-password" />
            </div>
            {errors.confirmarSenha && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {errors.confirmarSenha.message}</p>
            )}
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-2xl">
            {loading ? 'Salvando...' : 'Salvar nova senha'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-night-muted">
          <Link href="/auth/login" className="text-olive dark:text-olive-light font-medium hover:underline">Voltar ao login</Link>
        </p>
      </div>
    </div>
  )
}
