'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Award,
  Sparkles,
  CheckCircle2,
  Wind,
  CalendarCheck,
  Droplets,
  FlaskConical,
  Gift,
  History,
  Brush,
} from 'lucide-react'
import { usePoints } from '@/contexts/PointsContext'
import { useToast } from '@/components/ui/Toaster'
import { api } from '@/lib/api'
import type { PointAction } from '@/types'

type RewardItem = {
  id: string
  name: string
  pointsRequired: number
  type: string
  description: string
}

const ACTIONS: { action: PointAction; label: string; points: number; icon: typeof Brush }[] = [
  { action: 'escovacao', label: 'Escovei os dentes', points: 5, icon: Brush },
  { action: 'fio_dental', label: 'Passei fio dental', points: 5, icon: Wind },
  { action: 'consulta_presente', label: 'Compareci à consulta', points: 25, icon: CalendarCheck },
  { action: 'limpeza_bucal', label: 'Fiz limpeza bucal correta', points: 15, icon: Droplets },
  { action: 'uso_enxaguante', label: 'Usei enxaguante bucal', points: 5, icon: FlaskConical },
  { action: 'checkin_semanal', label: 'Check-in semanal de higiene', points: 20, icon: Sparkles },
]

const ACTION_LABELS: Record<PointAction, string> = {
  escovacao: 'Escovação',
  fio_dental: 'Fio dental',
  consulta_presente: 'Consulta',
  limpeza_bucal: 'Limpeza bucal',
  uso_enxaguante: 'Enxaguante',
  checkin_semanal: 'Check-in semanal',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  if (isToday) return `Hoje ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function Pontos() {
  const { totalPoints, recentLogs, addPoints, loading } = usePoints()
  const { toast } = useToast()
  const [adding, setAdding] = useState<PointAction | null>(null)
  const [rewards, setRewards] = useState<RewardItem[]>([])
  const [rewardsLoading, setRewardsLoading] = useState(true)

  useEffect(() => {
    api
      .get<RewardItem[]>('/rewards')
      .then((r) => setRewards(Array.isArray(r.data) ? r.data : []))
      .catch(() => setRewards([]))
      .finally(() => setRewardsLoading(false))
  }, [])

  const handleAdd = async (action: PointAction) => {
    setAdding(action)
    try {
      const { total } = await addPoints(action)
      toast(`+${ACTIONS.find((a) => a.action === action)?.points ?? 0} pontos! Total: ${total}`, 'success')
    } catch {
      toast('Não foi possível registrar. Tente de novo.', 'error')
    } finally {
      setAdding(null)
    }
  }

  return (
    <div className="px-4 lg:px-0 py-6 pb-24">
      <h1 className="text-xl lg:text-2xl font-bold text-gray-800 dark:text-night-text mb-6 flex items-center gap-2">
        <Award className="h-7 w-7 text-olive dark:text-olive-light" />
        Meus pontos
      </h1>

      {loading ? (
        <div className="h-32 rounded-2xl bg-gray-100 dark:bg-night-card animate-pulse" />
      ) : (
        <>
          {/* Card total */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gradient-to-br from-olive/15 to-olive-dark/10 dark:from-olive/20 dark:to-accent-purple/20 border border-olive/20 dark:border-olive/30 p-6 mb-8"
          >
            <p className="text-sm font-medium text-olive dark:text-olive-light mb-1">Total de pontos</p>
            <p className="text-4xl font-bold text-gray-800 dark:text-night-text">{totalPoints}</p>
            <p className="text-sm text-gray-500 dark:text-night-muted mt-1">
              Acumule pontos e troque por recompensas
            </p>
          </motion.div>

          {/* Registrar ações */}
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-night-muted mb-4">Registrar ação</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ACTIONS.map(({ action, label, points, icon: Icon }) => (
                <motion.button
                  key={action}
                  type="button"
                  onClick={() => handleAdd(action)}
                  disabled={adding !== null}
                  className="flex items-center gap-4 rounded-2xl bg-white dark:bg-night-card border border-gray-200 dark:border-night-border p-4 text-left
                    hover:border-olive/40 dark:hover:border-olive/50 hover:shadow-md transition-all disabled:opacity-60"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="w-12 h-12 rounded-xl bg-olive/10 dark:bg-olive/20 flex items-center justify-center shrink-0">
                    <Icon className="h-6 w-6 text-olive dark:text-olive-light" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 dark:text-night-text">{label}</p>
                    <p className="text-sm text-olive dark:text-olive-light">+{points} pts</p>
                  </div>
                  {adding === action ? (
                    <span className="text-xs text-gray-500">...</span>
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-olive dark:text-olive-light shrink-0" />
                  )}
                </motion.button>
              ))}
            </div>
          </section>

          {/* Recompensas (vindas do banco via API) */}
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-night-muted mb-4 flex items-center gap-2">
              <Gift className="h-4 w-4 text-olive" />
              Recompensas
            </h2>
            {rewardsLoading ? (
              <div className="h-24 rounded-2xl bg-gray-100 dark:bg-night-card animate-pulse" />
            ) : rewards.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-night-muted py-4">Nenhuma recompensa disponível no momento.</p>
            ) : (
              <div className="space-y-3">
                {rewards.map((r) => {
                  const canRedeem = totalPoints >= r.pointsRequired
                  return (
                    <div
                      key={r.id}
                      className={`rounded-2xl border p-4 flex items-center justify-between gap-4
                        ${canRedeem ? 'bg-olive/5 dark:bg-olive/10 border-olive/30' : 'bg-white dark:bg-night-card border-gray-200 dark:border-night-border'}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-olive/15 dark:bg-olive/25 flex items-center justify-center shrink-0">
                          <Gift className="h-5 w-5 text-olive dark:text-olive-light" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-night-text">{r.name}</p>
                          <p className="text-xs text-gray-500 dark:text-night-muted">{r.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-semibold text-olive dark:text-olive-light">{r.pointsRequired} pts</span>
                        {canRedeem ? (
                          <span className="text-xs bg-olive/20 text-olive dark:bg-olive/30 dark:text-olive-light px-2 py-1 rounded-lg">
                            Disponível
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Faltam {r.pointsRequired - totalPoints} pts
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Histórico recente */}
          {recentLogs.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-night-muted mb-4 flex items-center gap-2">
                <History className="h-4 w-4 text-olive" />
                Histórico recente
              </h2>
              <ul className="space-y-2">
                {recentLogs.slice(0, 10).map((log) => (
                  <li
                    key={log.id}
                    className="flex items-center justify-between rounded-xl bg-white dark:bg-night-card border border-gray-100 dark:border-night-border px-4 py-3"
                  >
                    <span className="text-sm text-gray-700 dark:text-night-muted">
                      {ACTION_LABELS[log.action]}
                    </span>
                    <span className="text-sm font-medium text-olive dark:text-olive-light">
                      +{log.points} pts
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(log.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}
