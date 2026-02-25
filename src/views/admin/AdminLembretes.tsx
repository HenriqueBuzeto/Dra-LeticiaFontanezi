'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Bell } from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/Toaster'

type Reminder = {
  id: string
  userId: string
  tipo: string
  dataEnvio: string
  status: string
  titulo?: string
  mensagem?: string
}

type UserOption = { id: string; nome: string; email: string }

export default function AdminLembretes() {
  const { toast } = useToast()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({
    userId: '',
    tipo: 'push',
    dataEnvio: new Date().toISOString().slice(0, 16),
    titulo: '',
    mensagem: '',
  })

  const load = () => {
    setLoading(true)
    api
      .get<Reminder[]>('/reminders/all')
      .then((r) => setReminders(Array.isArray(r.data) ? r.data : []))
      .catch(() => setReminders([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    api.get<UserOption[]>('/users').then((r) => {
      const list = Array.isArray(r.data) ? r.data : []
      setUsers(list.filter((u) => (u as { role?: string }).role === 'paciente').map((u) => ({ id: u.id, nome: u.nome, email: u.email })))
    }).catch(() => setUsers([]))
  }, [])

  const openModal = () => {
    setForm({
      userId: users[0]?.id ?? '',
      tipo: 'push',
      dataEnvio: new Date().toISOString().slice(0, 16),
      titulo: '',
      mensagem: '',
    })
    setModal(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/reminders', {
        userId: form.userId,
        tipo: form.tipo,
        dataEnvio: new Date(form.dataEnvio).toISOString(),
        titulo: form.titulo || undefined,
        mensagem: form.mensagem || undefined,
      })
      toast('Lembrete criado.', 'success')
      setModal(false)
      load()
    } catch (err: unknown) {
      toast((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erro ao criar lembrete.', 'error')
    }
  }

  const userName = (userId: string) => users.find((u) => u.id === userId)?.nome ?? userId

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-night-text">Lembretes</h1>
          <p className="text-gray-500 dark:text-night-muted text-sm mt-0.5">Envie lembretes para os pacientes.</p>
        </div>
        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-olive text-white font-medium shadow-button hover:opacity-95"
        >
          <Plus className="h-5 w-5" />
          Novo lembrete
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-mist/50 dark:border-night-border bg-white dark:bg-night-card p-12 text-center text-gray-500 dark:text-night-muted">
          Carregando...
        </div>
      ) : reminders.length === 0 ? (
        <div className="rounded-2xl border border-gray-mist/50 dark:border-night-border bg-white dark:bg-night-card p-12 text-center">
          <Bell className="h-12 w-12 text-gray-400 dark:text-night-muted mx-auto mb-4" />
          <p className="text-gray-600 dark:text-night-muted">Nenhum lembrete enviado.</p>
          <button type="button" onClick={openModal} className="mt-4 text-olive dark:text-olive-light font-medium">
            Criar lembrete
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-mist/50 dark:border-night-border bg-white dark:bg-night-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-mist/50 dark:border-night-border bg-gray-mist/30 dark:bg-night-surface">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-night-muted uppercase">Paciente</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-night-muted uppercase">Tipo</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-night-muted uppercase">Data envio</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-night-muted uppercase">Título</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-night-muted uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {reminders.map((r) => (
                  <tr key={r.id} className="border-b border-gray-mist/30 dark:border-night-border/50">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-night-text">{userName(r.userId)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-night-muted">{r.tipo}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-night-muted">
                      {new Date(r.dataEnvio).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-night-muted">{r.titulo ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${
                          r.status === 'enviado' ? 'bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-night-card border border-gray-mist/50 dark:border-night-border shadow-xl p-6"
          >
            <h2 className="text-lg font-bold text-gray-800 dark:text-night-text mb-4">Novo lembrete</h2>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-night-muted mb-1">Paciente</label>
                <select
                  required
                  value={form.userId}
                  onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
                  className="input-field"
                >
                  <option value="">Selecione</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.nome} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-night-muted mb-1">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                  className="input-field"
                >
                  <option value="push">Push</option>
                  <option value="email">E-mail</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-night-muted mb-1">Data/hora envio</label>
                <input
                  type="datetime-local"
                  required
                  value={form.dataEnvio}
                  onChange={(e) => setForm((f) => ({ ...f, dataEnvio: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-night-muted mb-1">Título</label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-night-muted mb-1">Mensagem</label>
                <textarea
                  value={form.mensagem}
                  onChange={(e) => setForm((f) => ({ ...f, mensagem: e.target.value }))}
                  className="input-field min-h-[80px]"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">Criar lembrete</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
