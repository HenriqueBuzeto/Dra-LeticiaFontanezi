'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Users, Calendar, Video, Gift, CalendarDays, ArrowRight, CheckCircle2, XCircle } from 'lucide-react'
import { api } from '@/lib/api'

interface Stats {
  usersCount: number
  appointmentsCount: number
  appointmentsTodayCount: number
  videosCount: number
  rewardsCount: number
}

interface CheckinItem {
  id: string
  userId: string
  userName: string
  data: string
  horario: string
  tipo: string
  checkinStatus: string
  checkinAt: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [checkins, setCheckins] = useState<CheckinItem[]>([])
  const [loading, setLoading] = useState(true)
  const [checkinsLoading, setCheckinsLoading] = useState(true)

  useEffect(() => {
    api
      .get<Stats>('/admin/stats')
      .then((r) => setStats(r.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    api
      .get<CheckinItem[]>('/admin/checkins')
      .then((r) => setCheckins(Array.isArray(r.data) ? r.data : []))
      .catch(() => setCheckins([]))
      .finally(() => setCheckinsLoading(false))
  }, [])

  const cards = [
    { label: 'Usuários', value: stats?.usersCount ?? '—', icon: Users, to: '/admin/usuarios', color: 'olive' },
    { label: 'Consultas hoje', value: stats?.appointmentsTodayCount ?? '—', icon: CalendarDays, to: '/admin/agenda', color: 'olive' },
    { label: 'Total de consultas', value: stats?.appointmentsCount ?? '—', icon: Calendar, to: '/admin/agenda', color: 'slate' },
    { label: 'Vídeos', value: stats?.videosCount ?? '—', icon: Video, to: '/admin/videos', color: 'slate' },
    { label: 'Recompensas', value: stats?.rewardsCount ?? '—', icon: Gift, to: '/admin/recompensas', color: 'slate' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-night-text">Visão geral</h1>
        <p className="text-gray-500 dark:text-night-muted mt-1">Resumo do painel administrativo</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-gray-mist/50 dark:bg-night-surface animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(({ label, value, icon: Icon, to, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={to ?? '#'}
                className="block rounded-2xl bg-white dark:bg-night-card border border-gray-mist/50 dark:border-night-border p-6 shadow-soft hover:shadow-glass hover:border-olive/30 dark:hover:border-olive/40 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-night-muted">{label}</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-night-text mt-1">{value}</p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      color === 'olive' ? 'bg-olive/15 text-olive dark:bg-olive/25 dark:text-olive-light' : 'bg-gray-mist/60 dark:bg-night-surface text-gray-600 dark:text-night-muted'
                    } group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm font-medium text-olive dark:text-olive-light">
                  Ver
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      <div className="rounded-2xl bg-olive/10 dark:bg-olive/15 border border-olive/20 dark:border-olive/30 p-6">
        <h2 className="font-bold text-gray-800 dark:text-night-text mb-2">Ações rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/agenda"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-olive text-white text-sm font-medium hover:opacity-95"
          >
            <Calendar className="h-4 w-4" />
            Nova consulta
          </Link>
          <Link
            href="/admin/lembretes"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-night-card border border-olive/40 text-olive dark:text-olive-light text-sm font-medium hover:bg-olive/10"
          >
            <CalendarDays className="h-4 w-4" />
            Enviar lembrete
          </Link>
          <Link
            href="/admin/videos"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-night-card border border-olive/40 text-olive dark:text-olive-light text-sm font-medium hover:bg-olive/10"
          >
            <Video className="h-4 w-4" />
            Adicionar vídeo
          </Link>
        </div>
      </div>

      {/* Check-ins antecipados (notificação para a doutora) */}
      <div className="rounded-2xl bg-white dark:bg-night-card border border-gray-mist/50 dark:border-night-border overflow-hidden">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-night-muted uppercase tracking-wider px-6 py-4 border-b border-gray-mist/50 dark:border-night-border flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-olive" />
          Check-ins antecipados
        </h2>
        {checkinsLoading ? (
          <div className="h-24 flex items-center justify-center text-gray-400 dark:text-night-muted text-sm">Carregando...</div>
        ) : checkins.length === 0 ? (
          <p className="px-6 py-6 text-sm text-gray-500 dark:text-night-muted">Nenhum check-in recente.</p>
        ) : (
          <ul className="divide-y divide-gray-mist/50 dark:divide-night-border">
            {checkins.slice(0, 10).map((c) => (
              <li key={c.id} className="px-6 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-800 dark:text-night-text">{c.userName}</p>
                  <p className="text-xs text-gray-500 dark:text-night-muted">
                    {new Date(c.data).toLocaleDateString('pt-BR')} · {c.horario} · {c.tipo}
                  </p>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                    c.checkinStatus === 'vai_comparecer'
                      ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                      : 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                  }`}
                >
                  {c.checkinStatus === 'vai_comparecer' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                  {c.checkinStatus === 'vai_comparecer' ? 'Vai comparecer' : 'Não vai comparecer'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
