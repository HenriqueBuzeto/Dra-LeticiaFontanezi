'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Video,
  Calendar,
  Bell,
  Gift,
  Users,
  Menu,
  X,
  LogOut,
  Stethoscope,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const nav = [
  { href: '/admin', icon: LayoutDashboard, label: 'Visão geral', end: true },
  { href: '/admin/videos', icon: Video, label: 'Vídeos', end: false },
  { href: '/admin/agenda', icon: Calendar, label: 'Agenda', end: false },
  { href: '/admin/lembretes', icon: Bell, label: 'Lembretes', end: false },
  { href: '/admin/recompensas', icon: Gift, label: 'Recompensas', end: false },
  { href: '/admin/usuarios', icon: Users, label: 'Usuários', end: false },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.replace('/auth/login')
  }

  const isActive = (href: string, end: boolean) => {
    if (end) return pathname === href
    return pathname?.startsWith(href) ?? false
  }

  return (
    <div className="min-h-screen bg-luxury-cream dark:bg-night-bg flex">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-white dark:bg-night-card border-r border-gray-mist/60 dark:border-night-border shadow-soft">
        <div className="p-6 border-b border-gray-mist/50 dark:border-night-border">
          <Link href="/admin" className="flex items-center gap-3">
            <img
              src="/Logo.png"
              alt="Dra. Letícia Fontanezi"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-contain shrink-0"
            />
            <div>
              <p className="font-bold text-gray-800 dark:text-night-text">Painel Admin</p>
              <p className="text-xs text-gray-500 dark:text-night-muted">Dra. Letícia</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-modern">
          {nav.map(({ href, icon: Icon, label, end }) => (
            <Link
              key={href ?? label}
              href={href ?? '#'}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive(href, end)
                  ? 'bg-olive text-white shadow-button'
                  : 'text-gray-600 dark:text-night-muted hover:bg-gray-mist/60 dark:hover:bg-night-surface hover:text-olive dark:hover:text-olive-light'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-mist/50 dark:border-night-border">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-600 dark:text-night-muted hover:bg-gray-mist/60 dark:hover:bg-night-surface"
          >
            <Stethoscope className="h-5 w-5" />
            Ver site
          </Link>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-night-card border-r border-gray-mist/60 dark:border-night-border shadow-xl transform transition-transform lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-mist/50 dark:border-night-border">
          <span className="font-bold text-gray-800 dark:text-night-text">Menu</span>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-mist/60 dark:hover:bg-night-surface"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {nav.map(({ href, icon: Icon, label, end }) => (
            <Link
              key={href ?? label}
              href={href ?? '#'}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                isActive(href, end) ? 'bg-olive text-white' : 'text-gray-600 dark:text-night-muted'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:px-8 bg-white/90 dark:bg-night-card/90 backdrop-blur-md border-b border-gray-mist/50 dark:border-night-border">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-mist/60 dark:hover:bg-night-surface"
          >
            <Menu className="h-6 w-6 text-gray-600 dark:text-night-muted" />
          </button>
          <div className="flex-1 lg:flex-none" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-night-muted hidden sm:inline">{user?.nome}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-night-muted hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
