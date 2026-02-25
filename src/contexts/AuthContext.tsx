import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { api } from '@/lib/api'
import type { User, AuthTokens } from '@/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateUser: (data: Partial<User>) => void
}

interface RegisterData {
  nome: string
  email: string
  senha: string
  telefone?: string
  dataNascimento?: string
}

const AuthContext = createContext<AuthContextType | null>(null)

const STORAGE_KEYS = { access: 'accessToken', refresh: 'refreshToken', user: 'user' }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const persistAndSetUser = useCallback((u: User | null, tokens?: AuthTokens) => {
    setUser(u)
    if (u) localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(u))
    else localStorage.removeItem(STORAGE_KEYS.user)
    if (tokens) {
      localStorage.setItem(STORAGE_KEYS.access, tokens.accessToken)
      localStorage.setItem(STORAGE_KEYS.refresh, tokens.refreshToken)
    }
  }, [])

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem(STORAGE_KEYS.access)
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    const isDemo = token === 'demo-access-token'
    try {
      const { data } = await api.get<User>('/users/me')
      let userData = { ...data }
      const stored = localStorage.getItem(STORAGE_KEYS.user)
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as User
          if (parsed.avatar) userData = { ...userData, avatar: parsed.avatar }
        } catch (_) { /* ignore */ }
      }
      persistAndSetUser(userData)
    } catch {
      if (isDemo) {
        try {
          const stored = localStorage.getItem(STORAGE_KEYS.user)
          if (stored) {
            setUser(JSON.parse(stored) as User)
            setLoading(false)
            return
          }
        } catch (_) { /* ignore */ }
      }
      localStorage.removeItem(STORAGE_KEYS.access)
      localStorage.removeItem(STORAGE_KEYS.refresh)
      localStorage.removeItem(STORAGE_KEYS.user)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [persistAndSetUser])

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      const { data } = await api.post<{ user: User; accessToken: string; refreshToken: string; expiresIn: number }>(
        '/auth/login',
        { email, password }
      )
      const user = data?.user
      if (!user) throw new Error('Resposta inválida do servidor.')
      persistAndSetUser(user, {
        accessToken: data.accessToken ?? '',
        refreshToken: data.refreshToken ?? '',
        expiresIn: data.expiresIn ?? 0,
      })
      return user
    },
    [persistAndSetUser]
  )

  const register = useCallback(
    async (form: RegisterData) => {
      const { data } = await api.post<{ user: User; accessToken: string; refreshToken: string; expiresIn: number }>(
        '/auth/register',
        form
      )
      const user = data?.user
      if (!user) throw new Error('Resposta inválida do servidor.')
      persistAndSetUser(user, {
        accessToken: data.accessToken ?? '',
        refreshToken: data.refreshToken ?? '',
        expiresIn: data.expiresIn ?? 0,
      })
    },
    [persistAndSetUser]
  )

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.access)
    localStorage.removeItem(STORAGE_KEYS.refresh)
    localStorage.removeItem(STORAGE_KEYS.user)
    setUser(null)
  }, [])

  const updateUser = useCallback((partial: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null
      const next = { ...prev, ...partial }
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(next))
      return next
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
