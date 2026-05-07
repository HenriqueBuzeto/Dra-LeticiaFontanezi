'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, PackageCheck, ShieldAlert, X } from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/Toaster'

type RedemptionStatus = 'pending' | 'approved' | 'rejected' | 'delivered' | 'cancelled'

type RedemptionRow = {
  id: string
  status: RedemptionStatus
  pointsCost: number
  requestedAt: string
  approvedAt?: string | null
  deliveredAt?: string | null
  rejectedReason?: string | null
  user: { id: string; nome: string; email: string } | null
  reward: { id: string; name: string; type: string; pointsRequired: number; imageUrl?: string | null } | null
}

function statusBadge(status: RedemptionStatus) {
  if (status === 'pending') return 'bg-amber-500/15 text-amber-700'
  if (status === 'approved') return 'bg-olive/15 text-olive'
  if (status === 'delivered') return 'bg-sky-500/15 text-sky-700'
  if (status === 'rejected') return 'bg-red-500/15 text-red-700'
  return 'bg-gray-mist/60 text-gray-700'
}

function formatDate(iso?: string | null) {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function AdminResgates() {
  const { toast } = useToast()
  const [items, setItems] = useState<RedemptionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState<string | null>(null)
  const [filter, setFilter] = useState<RedemptionStatus | 'all'>('pending')

  const load = () => {
    setLoading(true)
    api
      .get<RedemptionRow[]>('/admin/reward-redemptions')
      .then((r) => setItems(Array.isArray(r.data) ? r.data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'all') return items
    return items.filter((i) => i.status === filter)
  }, [items, filter])

  const update = async (id: string, status: RedemptionStatus) => {
    setActioning(id)
    try {
      let rejectedReason: string | undefined
      if (status === 'rejected') {
        rejectedReason = prompt('Motivo da recusa (opcional):') ?? undefined
      }
      await api.patch(`/admin/reward-redemptions/${id}`, { status, rejectedReason })
      toast('Atualizado com sucesso.', 'success')
      load()
    } catch (err: unknown) {
      toast((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erro ao atualizar.', 'error')
    } finally {
      setActioning(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-night-text">Resgates</h1>
          <p className="text-gray-500 dark:text-night-muted text-sm mt-0.5">Pedidos de resgate e fluxo de aprovação/entrega.</p>
        </div>

        <div className="flex items-center gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="input-field py-2.5">
            <option value="pending">Pendentes</option>
            <option value="approved">Aprovados</option>
            <option value="delivered">Entregues</option>
            <option value="rejected">Recusados</option>
            <option value="cancelled">Cancelados</option>
            <option value="all">Todos</option>
          </select>
          <button type="button" onClick={load} className="btn-secondary px-4 py-2.5">
            Atualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-mist/50 dark:border-night-border bg-white dark:bg-night-card p-12 text-center text-gray-500 dark:text-night-muted">
          Carregando...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-mist/50 dark:border-night-border bg-white dark:bg-night-card p-12 text-center">
          <ShieldAlert className="h-12 w-12 text-gray-400 dark:text-night-muted mx-auto mb-4" />
          <p className="text-gray-600 dark:text-night-muted">Nenhum resgate encontrado.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-mist/50 dark:border-night-border bg-white dark:bg-night-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-mist/50 dark:border-night-border bg-gray-mist/30 dark:bg-night-surface">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-night-muted uppercase">Paciente</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-night-muted uppercase">Recompensa</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-night-muted uppercase">Pontos</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-night-muted uppercase">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-night-muted uppercase">Solicitado</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-night-muted uppercase w-48">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-gray-mist/30 dark:border-night-border/50 hover:bg-gray-mist/20 dark:hover:bg-night-surface/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 dark:text-night-text">{r.user?.nome ?? '-'}</p>
                      <p className="text-xs text-gray-500 dark:text-night-muted">{r.user?.email ?? ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 dark:text-night-text">{r.reward?.name ?? '-'}</p>
                      <p className="text-xs text-gray-500 dark:text-night-muted">{r.reward?.type ?? ''}</p>
                    </td>
                    <td className="px-4 py-3 text-olive dark:text-olive-light font-semibold">{r.pointsCost} XP</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${statusBadge(r.status)}`}>{r.status}</span>
                      {r.status === 'rejected' && r.rejectedReason ? (
                        <p className="text-xs text-gray-500 mt-1">{r.rejectedReason}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-night-muted">{formatDate(r.requestedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {r.status === 'pending' ? (
                          <>
                            <motion.button
                              type="button"
                              disabled={actioning === r.id}
                              onClick={() => update(r.id, 'approved')}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-olive text-white text-sm font-medium hover:opacity-95"
                              whileTap={{ scale: 0.98 }}
                            >
                              <Check className="h-4 w-4" />
                              Aprovar
                            </motion.button>
                            <motion.button
                              type="button"
                              disabled={actioning === r.id}
                              onClick={() => update(r.id, 'rejected')}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:opacity-95"
                              whileTap={{ scale: 0.98 }}
                            >
                              <X className="h-4 w-4" />
                              Recusar
                            </motion.button>
                          </>
                        ) : null}

                        {r.status === 'approved' ? (
                          <motion.button
                            type="button"
                            disabled={actioning === r.id}
                            onClick={() => update(r.id, 'delivered')}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-600 text-white text-sm font-medium hover:opacity-95"
                            whileTap={{ scale: 0.98 }}
                          >
                            <PackageCheck className="h-4 w-4" />
                            Marcar entregue
                          </motion.button>
                        ) : null}

                        {(r.status === 'delivered' || r.status === 'rejected' || r.status === 'cancelled') && (
                          <span className="text-xs text-gray-500">{r.status === 'delivered' ? `Entregue em ${formatDate(r.deliveredAt)}` : ''}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
