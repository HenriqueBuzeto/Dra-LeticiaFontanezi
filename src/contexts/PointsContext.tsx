import { createContext, useContext, useCallback, useState, useEffect, ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import type { PointsSummary, PointAction } from '@/types'

const STORAGE_KEY = 'lf_points_demo'

interface PointsContextValue {
  totalPoints: number
  recentLogs: PointsSummary['recentLogs']
  loading: boolean
  addPoints: (action: PointAction, metadata?: string) => Promise<{ total: number }>
  refresh: () => Promise<void>
}

const PointsContext = createContext<PointsContextValue | null>(null)

function getDemoData(): PointsSummary {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as PointsSummary
      return {
        totalPoints: parsed.totalPoints ?? 0,
        recentLogs: Array.isArray(parsed.recentLogs) ? parsed.recentLogs : [],
      }
    }
  } catch {
  }
  return { totalPoints: 0, recentLogs: [] }
}

function saveDemoData(data: PointsSummary) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
  }
}

export function PointsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [summary, setSummary] = useState<PointsSummary>({ totalPoints: 0, recentLogs: [] })
  const [loading, setLoading] = useState(true)

  const isDemo = typeof localStorage !== 'undefined' && localStorage.getItem('accessToken') === 'demo-access-token'

  const refresh = useCallback(async () => {
    if (!user) {
      setSummary({ totalPoints: 0, recentLogs: [] })
      setLoading(false)
      return
    }
    if (isDemo) {
      setSummary(getDemoData())
      setLoading(false)
      return
    }
    try {
      const { data } = await api.get<PointsSummary>('/points/summary')
      setSummary(data)
    } catch {
      setSummary({ totalPoints: 0, recentLogs: [] })
    } finally {
      setLoading(false)
    }
  }, [user?.id, isDemo])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addPoints = useCallback(
    async (action: PointAction, metadata?: string): Promise<{ total: number }> => {
      if (isDemo) {
        const pointsByAction: Record<PointAction, number> = {
          escovacao: 5,
          fio_dental: 5,
          consulta_presente: 25,
          limpeza_bucal: 15,
          uso_enxaguante: 5,
          checkin_semanal: 20,
        }
        const points = pointsByAction[action] ?? 10
        const newLog = {
          id: `demo-${Date.now()}`,
          userId: user?.id ?? '',
          action,
          points,
          metadata,
          createdAt: new Date().toISOString(),
        }
        const current = getDemoData()
        const next: PointsSummary = {
          totalPoints: current.totalPoints + points,
          recentLogs: [newLog, ...current.recentLogs].slice(0, 50),
        }
        saveDemoData(next)
        setSummary(next)
        return { total: next.totalPoints }
      }
      const { data } = await api.post<{ total: number }>('/points/add', { action, metadata })
      await refresh()
      return { total: data.total }
    },
    [user?.id, isDemo, refresh]
  )

  const value: PointsContextValue = {
    totalPoints: summary.totalPoints,
    recentLogs: summary.recentLogs,
    loading,
    addPoints,
    refresh,
  }

  return <PointsContext.Provider value={value}>{children}</PointsContext.Provider>
}

export function usePoints() {
  const ctx = useContext(PointsContext)
  if (!ctx) throw new Error('usePoints must be used within PointsProvider')
  return ctx
}
