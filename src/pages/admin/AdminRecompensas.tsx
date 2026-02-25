'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, Gift } from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/Toaster'

type RewardItem = {
  id: string
  name: string
  pointsRequired: number
  type: string
  description: string
}

const TIPOS = ['escova', 'kit', 'consulta', 'brinde']

export default function AdminRecompensas() {
  const { toast } = useToast()
  const [items, setItems] = useState<RewardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', pointsRequired: 50, type: 'brinde', description: '' })

  const load = () => {
    setLoading(true)
    api
      .get<RewardItem[]>('/rewards')
      .then((r) => setItems(Array.isArray(r.data) ? r.data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const openAdd = () => {
    setForm({ name: '', pointsRequired: 50, type: 'brinde', description: '' })
    setEditingId(null)
    setModal('add')
  }
  const openEdit = (r: RewardItem) => {
    setForm({
      name: r.name,
      pointsRequired: r.pointsRequired,
      type: r.type,
      description: r.description,
    })
    setEditingId(r.id)
    setModal('edit')
  }
  const closeModal = () => {
    setModal(null)
    setEditingId(null)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        await api.patch(`/rewards/${editingId}`, form)
        toast('Recompensa atualizada.', 'success')
      } else {
        await api.post('/rewards', form)
        toast('Recompensa adicionada.', 'success')
      }
      closeModal()
      load()
    } catch (err: unknown) {
      toast((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erro ao salvar.', 'error')
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Remover esta recompensa?')) return
    try {
      await api.delete(`/rewards/${id}`)
      toast('Recompensa removida.', 'success')
      load()
    } catch {
      toast('Erro ao remover.', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-night-text">Recompensas</h1>
          <p className="text-gray-500 dark:text-night-muted text-sm mt-0.5">Produtos e brindes que os pacientes podem trocar por pontos.</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-olive text-white font-medium shadow-button hover:opacity-95"
        >
          <Plus className="h-5 w-5" />
          Adicionar recompensa
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-mist/50 dark:border-night-border bg-white dark:bg-night-card p-12 text-center text-gray-500 dark:text-night-muted">
          Carregando...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-gray-mist/50 dark:border-night-border bg-white dark:bg-night-card p-12 text-center">
          <Gift className="h-12 w-12 text-gray-400 dark:text-night-muted mx-auto mb-4" />
          <p className="text-gray-600 dark:text-night-muted">Nenhuma recompensa cadastrada.</p>
          <button type="button" onClick={openAdd} className="mt-4 text-olive dark:text-olive-light font-medium">
            Adicionar recompensa
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-mist/50 dark:border-night-border bg-white dark:bg-night-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-mist/50 dark:border-night-border bg-gray-mist/30 dark:bg-night-surface">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-night-muted uppercase">Nome</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-night-muted uppercase">Tipo</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-night-muted uppercase">Pontos</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-night-muted uppercase">Descrição</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-night-muted uppercase w-28">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id} className="border-b border-gray-mist/30 dark:border-night-border/50 hover:bg-gray-mist/20 dark:hover:bg-night-surface/50">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-night-text">{r.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-night-muted">{r.type}</td>
                    <td className="px-4 py-3 text-olive dark:text-olive-light font-medium">{r.pointsRequired} pts</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-night-muted text-sm">{r.description}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(r)}
                          className="p-2 rounded-lg text-gray-600 dark:text-night-muted hover:bg-olive/15 hover:text-olive dark:hover:text-olive-light"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(r.id)}
                          className="p-2 rounded-lg text-gray-600 dark:text-night-muted hover:bg-red-500/15 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeModal}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-night-card border border-gray-mist/50 dark:border-night-border shadow-xl p-6"
          >
            <h2 className="text-lg font-bold text-gray-800 dark:text-night-text mb-4">
              {editingId ? 'Editar recompensa' : 'Adicionar recompensa'}
            </h2>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-night-muted mb-1">Nome</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-night-muted mb-1">Tipo</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="input-field"
                >
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-night-muted mb-1">Pontos necessários</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={form.pointsRequired}
                  onChange={(e) => setForm((f) => ({ ...f, pointsRequired: parseInt(e.target.value, 10) || 0 }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-night-muted mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">{editingId ? 'Salvar' : 'Adicionar'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
