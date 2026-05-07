'use client'

import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Award,
  BadgeCheck,
  BarChart3,
  Sparkles,
  CheckCircle2,
  Gift,
  History,
  Brush,
  Flame,
  Zap,
  CalendarCheck,
  Wind,
  Droplets,
  FlaskConical,
  Crown,
} from 'lucide-react'
import { usePoints } from '@/contexts/PointsContext'
import { useToast } from '@/components/ui/Toaster'
import { api } from '@/lib/api'
import type { PointAction } from '@/types'
import { useAuth } from '@/contexts/AuthContext'

type RewardItem = {
  id: string
  name: string
  pointsRequired: number
  type: string
  description: string
  imageUrl?: string | null
  quantity?: number
  active?: boolean
  category?: string | null
  featured?: boolean
}

type RewardRedemption = {
  id: string
  userId: string
  rewardId: string
  pointsCost: number
  status: 'pending' | 'approved' | 'rejected' | 'delivered' | 'cancelled'
  requestedAt: string
  approvedAt?: string | null
  deliveredAt?: string | null
  rejectedReason?: string | null
}

const ACTIONS: { action: PointAction; label: string; points: number; icon: typeof Brush }[] = [
  { action: 'escovacao', label: 'Escovei os dentes', points: 5, icon: Brush },
  { action: 'fio_dental', label: 'Passei fio dental', points: 5, icon: Wind },
  { action: 'consulta_presente', label: 'Compareci à consulta', points: 25, icon: CalendarCheck },
  { action: 'limpeza_bucal', label: 'Fiz limpeza bucal correta', points: 15, icon: Droplets },
  { action: 'uso_enxaguante', label: 'Usei enxaguante bucal', points: 5, icon: FlaskConical },
  { action: 'checkin_semanal', label: 'Check-in semanal de higiene', points: 20, icon: Sparkles },
]

const DAILY_MISSIONS: { action: PointAction; title: string; subtitle: string; points: number; icon: typeof Brush }[] = [
  { action: 'escovacao', title: 'Escovou os dentes?', subtitle: 'Registre sua escovação de hoje.', points: 5, icon: Brush },
  { action: 'fio_dental', title: 'Passou fio dental?', subtitle: 'O hábito que mais ajuda no tratamento.', points: 5, icon: Wind },
  { action: 'limpeza_bucal', title: 'Higiene completa', subtitle: 'Capriche na limpeza ao redor dos braquetes.', points: 15, icon: Droplets },
  { action: 'uso_enxaguante', title: 'Usou enxaguante?', subtitle: 'Quando indicado, finalize com enxaguante.', points: 5, icon: FlaskConical },
]

const LEVELS = [
  { level: 1, name: 'Iniciante do Sorriso', minXp: 0, maxXp: 99, color: 'bg-olive/10 text-olive' },
  { level: 2, name: 'Escovador Oficial', minXp: 100, maxXp: 249, color: 'bg-accent-purple/10 text-accent-purple' },
  { level: 3, name: 'Mestre do Fio Dental', minXp: 250, maxXp: 449, color: 'bg-sky-500/10 text-sky-700' },
  { level: 4, name: 'Guardião do Sorriso', minXp: 450, maxXp: 699, color: 'bg-amber-500/10 text-amber-700' },
  { level: 5, name: 'Elite Ortodôntica', minXp: 700, maxXp: 999, color: 'bg-rose-500/10 text-rose-700' },
  { level: 6, name: 'Lenda do Sorriso', minXp: 1000, maxXp: 999999, color: 'bg-gray-900/10 text-gray-900 dark:bg-white/10 dark:text-white' },
] as const

const STORAGE = {
  daily: 'lf_gamification_daily',
  streak: 'lf_gamification_streak',
} as const

type DailyState = {
  dateKey: string
  completed: Partial<Record<PointAction, boolean>>
}

type StreakState = {
  lastDateKey: string | null
  current: number
  best: number
}

function getDateKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function loadDailyState(todayKey: string): DailyState {
  try {
    const raw = localStorage.getItem(STORAGE.daily)
    if (!raw) return { dateKey: todayKey, completed: {} }
    const parsed = JSON.parse(raw) as DailyState
    if (!parsed || parsed.dateKey !== todayKey) return { dateKey: todayKey, completed: {} }
    return {
      dateKey: todayKey,
      completed: parsed.completed ?? {},
    }
  } catch {
    return { dateKey: todayKey, completed: {} }
  }
}

function saveDailyState(state: DailyState) {
  try {
    localStorage.setItem(STORAGE.daily, JSON.stringify(state))
  } catch {
  }
}

function loadStreakState(): StreakState {
  try {
    const raw = localStorage.getItem(STORAGE.streak)
    if (!raw) return { lastDateKey: null, current: 0, best: 0 }
    const parsed = JSON.parse(raw) as StreakState
    return {
      lastDateKey: parsed?.lastDateKey ?? null,
      current: parsed?.current ?? 0,
      best: parsed?.best ?? 0,
    }
  } catch {
    return { lastDateKey: null, current: 0, best: 0 }
  }
}

function saveStreakState(state: StreakState) {
  try {
    localStorage.setItem(STORAGE.streak, JSON.stringify(state))
  } catch {
  }
}

const ACTION_LABELS: Record<PointAction, string> = {
  escovacao: 'Escovação',
  fio_dental: 'Fio dental',
  consulta_presente: 'Consulta',
  limpeza_bucal: 'Limpeza bucal',
  uso_enxaguante: 'Enxaguante',
  checkin_semanal: 'Check-in semanal',
  reward_redeem: 'Resgate de recompensa',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  if (isToday) return `Hoje ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function Pontos() {
  const { user } = useAuth()
  const { totalPoints, recentLogs, addPoints, loading } = usePoints()
  const { toast } = useToast()
  const [adding, setAdding] = useState<PointAction | null>(null)
  const [rewards, setRewards] = useState<RewardItem[]>([])
  const [rewardsLoading, setRewardsLoading] = useState(true)
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([])
  const [redeeming, setRedeeming] = useState<string | null>(null)
  const [daily, setDaily] = useState<DailyState | null>(null)
  const [streak, setStreak] = useState<StreakState | null>(null)

  const todayKey = useMemo(() => getDateKey(), [])

  const levelInfo = useMemo(() => {
    const xp = totalPoints
    const current = LEVELS.find((l) => xp >= l.minXp && xp <= l.maxXp) ?? LEVELS[0]
    const next = LEVELS.find((l) => l.level === current.level + 1) ?? null
    const max = current.maxXp
    const min = current.minXp
    const progressWithin = Math.max(0, Math.min(1, (xp - min) / Math.max(1, max - min + 1)))
    const nextDelta = next ? Math.max(0, next.minXp - xp) : 0
    return {
      xp,
      current,
      next,
      progressWithin,
      nextDelta,
    }
  }, [totalPoints])

  useEffect(() => {
    api
      .get<RewardItem[]>('/rewards')
      .then((r) => setRewards(Array.isArray(r.data) ? r.data : []))
      .catch(() => setRewards([]))
      .finally(() => setRewardsLoading(false))
  }, [])

  const loadRedemptions = async () => {
    try {
      const { data } = await api.get<RewardRedemption[]>('/rewards/redemptions')
      setRedemptions(Array.isArray(data) ? data : [])
    } catch {
      setRedemptions([])
    }
  }

  useEffect(() => {
    loadRedemptions()
  }, [])

  useEffect(() => {
    setDaily(loadDailyState(todayKey))
    setStreak(loadStreakState())
  }, [todayKey])

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

  const completeDailyMission = async (action: PointAction) => {
    if (!daily) return
    if (daily.completed[action]) return
    setAdding(action)
    try {
      const { total } = await addPoints(action)
      const nextDaily: DailyState = {
        dateKey: todayKey,
        completed: { ...daily.completed, [action]: true },
      }
      saveDailyState(nextDaily)
      setDaily(nextDaily)

      const basePoints = DAILY_MISSIONS.find((m) => m.action === action)?.points ?? 0
      toast(`Missão concluída! +${basePoints} XP`, 'success')

      setStreak((prev) => {
        const currentState = prev ?? loadStreakState()
        const last = currentState.lastDateKey
        const yesterdayKey = getDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000))
        const isNewDay = last !== todayKey

        let nextCurrent = currentState.current
        if (isNewDay) {
          if (last === yesterdayKey) nextCurrent = currentState.current + 1
          else nextCurrent = 1
        }
        const nextState: StreakState = {
          lastDateKey: todayKey,
          current: nextCurrent,
          best: Math.max(currentState.best, nextCurrent),
        }
        saveStreakState(nextState)
        return nextState
      })

      toast(`Total atualizado: ${total} XP`, 'success')
    } catch {
      toast('Não foi possível registrar a missão. Tente de novo.', 'error')
    } finally {
      setAdding(null)
    }
  }

  const dailyProgress = useMemo(() => {
    if (!daily) return { done: 0, total: DAILY_MISSIONS.length, percent: 0 }
    const done = DAILY_MISSIONS.filter((m) => !!daily.completed[m.action]).length
    const total = DAILY_MISSIONS.length
    const percent = Math.round((done / Math.max(1, total)) * 100)
    return { done, total, percent }
  }, [daily])

  const achievements = useMemo(() => {
    const list: { title: string; description: string; icon: typeof BadgeCheck; unlocked: boolean }[] = [
      {
        title: 'Primeiro registro',
        description: 'Você registrou sua primeira ação no app.',
        icon: BadgeCheck,
        unlocked: recentLogs.length > 0,
      },
      {
        title: 'Sequência 7 dias',
        description: 'Você manteve uma rotina por 7 dias seguidos.',
        icon: Flame,
        unlocked: (streak?.current ?? 0) >= 7,
      },
      {
        title: 'Rotina em dia',
        description: 'Concluiu todas as missões do dia.',
        icon: Zap,
        unlocked: dailyProgress.done === dailyProgress.total && dailyProgress.total > 0,
      },
      {
        title: 'Guardião do sorriso',
        description: 'Chegou ao nível 4.',
        icon: Crown,
        unlocked: levelInfo.current.level >= 4,
      },
    ]
    return list
  }, [recentLogs.length, streak?.current, dailyProgress.done, dailyProgress.total, levelInfo.current.level])

  const redemptionByReward = useMemo(() => {
    const map = new Map<string, RewardRedemption>()
    for (const r of redemptions) {
      const prev = map.get(r.rewardId)
      if (!prev) {
        map.set(r.rewardId, r)
        continue
      }
      if (new Date(r.requestedAt).getTime() > new Date(prev.requestedAt).getTime()) map.set(r.rewardId, r)
    }
    return map
  }, [redemptions])

  const redeemReward = async (rewardId: string) => {
    setRedeeming(rewardId)
    try {
      await api.post(`/rewards/${rewardId}/redeem`)
      toast('Pedido de resgate enviado. A clínica vai avaliar e aprovar.', 'success')
      await loadRedemptions()
    } catch (err: unknown) {
      toast((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Não foi possível solicitar o resgate.', 'error')
    } finally {
      setRedeeming(null)
    }
  }

  return (
    <div className="px-4 lg:px-0 py-6 pb-24">
      <div className="flex items-center justify-between gap-3 mb-5">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-800 dark:text-night-text flex items-center gap-2">
          <Award className="h-7 w-7 text-olive dark:text-olive-light" />
          Pontos & progresso
        </h1>
        <span className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-night-muted">
          <Sparkles className="h-4 w-4 text-olive" />
          Gamificação do sorriso
        </span>
      </div>

      {loading ? (
        <div className="h-32 rounded-2xl bg-gray-100 dark:bg-night-card animate-pulse" />
      ) : (
        <>
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl overflow-hidden border border-gray-mist/50 dark:border-night-border bg-gradient-to-br from-olive/12 via-white/70 to-accent-purple/12 dark:from-olive/20 dark:via-night-surface/40 dark:to-accent-purple/10 shadow-soft p-5 sm:p-6 mb-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.nome}
                    className="w-14 h-14 rounded-2xl object-cover border border-gray-mist/60 shadow-soft"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-olive/15 border border-olive/25 flex items-center justify-center text-olive font-bold">
                    {(user?.nome?.trim()?.[0] ?? 'P').toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Olá, {user?.nome ?? 'Paciente'}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${levelInfo.current.color}`}>
                      Nível {levelInfo.current.level}
                    </span>
                    <p className="text-lg font-bold text-gray-900 dark:text-night-text">{levelInfo.current.name}</p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-night-muted mt-1">
                    {levelInfo.next ? `Você está a ${levelInfo.nextDelta} XP do próximo nível.` : 'Você atingiu o nível máximo. Parabéns!'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                <div className="rounded-2xl bg-white/80 dark:bg-night-card border border-gray-mist/50 dark:border-night-border p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">XP</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-night-text mt-1">{levelInfo.xp}</p>
                </div>
                <div className="rounded-2xl bg-white/80 dark:bg-night-card border border-gray-mist/50 dark:border-night-border p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Streak</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-night-text mt-1">{streak?.current ?? 0}d</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Melhor: {streak?.best ?? 0}d</p>
                </div>
                <div className="rounded-2xl bg-white/80 dark:bg-night-card border border-gray-mist/50 dark:border-night-border p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Missões</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-night-text mt-1">{dailyProgress.done}/{dailyProgress.total}</p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-night-muted mb-2">
                <span>Progresso do nível</span>
                <span>{Math.round(levelInfo.progressWithin * 100)}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-gray-mist/60 dark:bg-night-surface overflow-hidden" aria-hidden="true">
                <div className="h-full bg-gradient-premium" style={{ width: `${Math.round(levelInfo.progressWithin * 100)}%` }} />
              </div>
            </div>
          </motion.section>

          <section className="mb-8">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-night-muted flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-olive" />
                Missões diárias
              </h2>
              <span className="text-xs text-gray-500 dark:text-night-muted">{dailyProgress.percent}% concluído</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DAILY_MISSIONS.map(({ action, title, subtitle, points, icon: Icon }) => {
                const done = !!daily?.completed[action]
                return (
                  <motion.div
                    key={action}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl border p-4 bg-white dark:bg-night-card shadow-soft transition ${
                      done ? 'border-olive/35 bg-olive/5 dark:bg-olive/10' : 'border-gray-mist/60 dark:border-night-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-olive/10 dark:bg-olive/20 flex items-center justify-center shrink-0">
                          <Icon className="h-5 w-5 text-olive dark:text-olive-light" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-night-text">{title}</p>
                          <p className="text-sm text-gray-600 dark:text-night-muted mt-0.5 leading-relaxed">{subtitle}</p>
                          <p className="text-sm text-olive dark:text-olive-light font-semibold mt-2">+{points} XP</p>
                        </div>
                      </div>
                      {done ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-olive bg-olive/15 px-2 py-1 rounded-lg">
                          <CheckCircle2 className="h-4 w-4" />
                          Concluída
                        </span>
                      ) : (
                        <motion.button
                          type="button"
                          onClick={() => completeDailyMission(action)}
                          disabled={adding !== null}
                          className="btn-primary px-4 py-2.5 text-sm"
                          whileTap={{ scale: 0.98 }}
                        >
                          Concluir
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>

            <div className="mt-4 rounded-2xl border border-gray-mist/60 dark:border-night-border bg-white/70 dark:bg-night-card p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-olive/10 flex items-center justify-center shrink-0">
                  <Flame className="h-5 w-5 text-olive" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-night-text">Sequência (streak)</p>
                  <p className="text-sm text-gray-600 dark:text-night-muted mt-0.5">
                    Você está há <span className="font-semibold text-gray-900 dark:text-night-text">{streak?.current ?? 0} dias</span> cuidando do sorriso.
                    {streak?.current ? ' Continue para manter o ritmo.' : ' Comece hoje concluindo uma missão.'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Registrar ações (rápido) */}
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-night-muted mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-olive" />
              Registrar ação rápida
            </h2>
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

          <section className="mb-8">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-night-muted mb-4 flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-olive" />
              Conquistas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {achievements.map((a) => (
                <div
                  key={a.title}
                  className={`rounded-2xl border p-4 bg-white dark:bg-night-card shadow-soft ${
                    a.unlocked ? 'border-olive/30' : 'border-gray-mist/60 dark:border-night-border opacity-70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.unlocked ? 'bg-olive/12' : 'bg-gray-mist/40'}`}>
                      <a.icon className={`h-5 w-5 ${a.unlocked ? 'text-olive' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-night-text">{a.title}</p>
                      <p className="text-sm text-gray-600 dark:text-night-muted mt-0.5 leading-relaxed">{a.description}</p>
                      <p className="text-xs font-semibold mt-2 text-gray-500">
                        {a.unlocked ? <span className="text-olive">Desbloqueada</span> : 'Bloqueada'}
                      </p>
                    </div>
                  </div>
                </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {rewards.map((r) => {
                  const canRedeem = totalPoints >= r.pointsRequired
                  const missing = Math.max(0, r.pointsRequired - totalPoints)
                  const pct = Math.round(Math.min(100, (totalPoints / Math.max(1, r.pointsRequired)) * 100))
                  const redemption = redemptionByReward.get(r.id) ?? null
                  const inProgress = redemption?.status === 'pending' || redemption?.status === 'approved'
                  const statusLabel = redemption?.status
                    ? redemption.status === 'pending'
                      ? 'Pedido em análise'
                      : redemption.status === 'approved'
                        ? 'Aprovado'
                        : redemption.status === 'delivered'
                          ? 'Entregue'
                          : redemption.status === 'rejected'
                            ? 'Recusado'
                            : 'Cancelado'
                    : null
                  const stock = r.quantity ?? null
                  return (
                    <motion.div
                      key={r.id}
                      className={`rounded-3xl overflow-hidden border shadow-soft bg-white dark:bg-night-card ${
                        canRedeem ? 'border-olive/35' : 'border-gray-mist/60 dark:border-night-border'
                      }`}
                      whileHover={{ y: -2 }}
                    >
                      {r.imageUrl ? (
                        <div className="aspect-[16/9] bg-gray-mist/40 dark:bg-night-surface">
                          <img src={r.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : null}
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-olive/12 dark:bg-olive/20 flex items-center justify-center shrink-0">
                              <Gift className="h-5 w-5 text-olive" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-night-text leading-snug">{r.name}</p>
                              <p className="text-sm text-gray-600 dark:text-night-muted mt-1 leading-relaxed">{r.description}</p>
                            </div>
                          </div>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-mist/50 dark:bg-night-surface text-gray-700 dark:text-night-muted">
                            {r.type}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {typeof stock === 'number' ? (
                            <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${stock > 0 ? 'bg-olive/10 text-olive' : 'bg-gray-mist/60 text-gray-600'}`}>
                              Estoque: {stock}
                            </span>
                          ) : null}
                          {r.featured ? (
                            <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-amber-500/15 text-amber-700">Destaque</span>
                          ) : null}
                          {statusLabel ? (
                            <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-sky-500/15 text-sky-700">{statusLabel}</span>
                          ) : null}
                          {redemption?.status === 'rejected' && redemption.rejectedReason ? (
                            <span className="text-xs text-gray-500">{redemption.rejectedReason}</span>
                          ) : null}
                        </div>

                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-night-muted mb-2">
                            <span>{r.pointsRequired} XP</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-gray-mist/60 dark:bg-night-surface overflow-hidden" aria-hidden="true">
                            <div className="h-full bg-gradient-premium" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-3">
                            {canRedeem ? (
                              <span className="text-xs font-semibold text-olive bg-olive/12 px-2 py-1 rounded-lg">Disponível</span>
                            ) : (
                              <span className="text-xs text-gray-500">Faltam {missing} XP</span>
                            )}
                            <motion.button
                              type="button"
                              disabled={!canRedeem || redeeming === r.id || inProgress || (typeof stock === 'number' && stock <= 0)}
                              onClick={() => redeemReward(r.id)}
                              className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition ${
                                canRedeem && !inProgress
                                  ? 'bg-olive text-white shadow-button hover:opacity-95'
                                  : 'bg-gray-mist/60 dark:bg-night-surface text-gray-400 cursor-not-allowed'
                              }`}
                              whileTap={canRedeem && !inProgress ? { scale: 0.98 } : undefined}
                            >
                              {redeeming === r.id ? 'Enviando...' : inProgress ? 'Aguardando' : 'Resgatar'}
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
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
