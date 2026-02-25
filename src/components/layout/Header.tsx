'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Scan, Video, Calendar, User, Bell, Sun, Moon, Menu, X, CalendarPlus, Award, LayoutDashboard } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { ENABLE_AR_SIMULATOR, AR_ROUTE_PATH, AR_NAV_LABEL } from '@/features/ar/config'

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Início' },
  ...(ENABLE_AR_SIMULATOR ? [{ to: AR_ROUTE_PATH, icon: Scan, label: AR_NAV_LABEL }] : []),
  { to: '/videos', icon: Video, label: 'Vídeos' },
  { to: '/appointments', icon: Calendar, label: 'Agenda' },
  { to: '/reminders', icon: Bell, label: 'Lembretes' },
  { to: '/pontos', icon: Award, label: 'Pontos' },
  { to: '/profile', icon: User, label: 'Perfil' },
]

function NavLinks({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname()
  const isActive = (to: string) =>
    pathname === to || (to === '/dashboard' && (pathname === '/' || pathname === '/dashboard'))

  if (isMobile) {
    return (
      <>
        {navItems.map(({ to, icon: Icon, label }) => {
          const href = to ?? '#'
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-olive text-white dark:bg-olive-light dark:text-gray-900'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-luxury-warmGray/60 dark:hover:bg-gray-700/80'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
              <span>{label}</span>
            </Link>
          )
        })}
      </>
    )
  }

  return (
    <>
      {navItems.map(({ to, label }) => {
        const href = to ?? '#'
        const active = isActive(href)
        return (
          <Link
            key={href}
            href={href}
            className={`header-nav-pill ${active ? 'header-nav-pill-active' : ''} ${
              active ? 'text-olive dark:text-accent-purpleLight' : 'text-gray-600 dark:text-night-muted'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </>
  )
}

export default function Header() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isAdmin = user?.role === 'admin'

  return (
    <>
      <div className="sticky top-0 z-40 w-full px-4 pt-4 lg:px-16 xl:px-24 lg:pt-5">
        <header
          className="relative mx-auto flex h-14 lg:h-16 items-center justify-between gap-4 rounded-2xl
            bg-white/85 dark:bg-night-surface backdrop-blur-xl
            border border-luxury-warmGray/40 dark:border-night-border
            shadow-[0_4px_24px_rgba(131,167,129,0.08)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)]
            px-4 sm:px-5 lg:px-6 w-full max-w-6xl xl:max-w-7xl overflow-visible"
        >
          {/* Logo – maior que a barra, transborda sem aumentar o header */}
          <Link
            href="/dashboard"
            className="flex items-center shrink-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive/40 -my-2 lg:-my-3"
          >
            <motion.img
              src="/Logo.png"
              alt="Dra. Letícia Fontanezi"
              className="h-20 w-auto sm:h-24 lg:h-28 xl:h-32 object-contain object-left"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            />
          </Link>

          {/* Desktop: nav central com pills */}
          <nav className="hidden lg:flex flex-1 items-center justify-center gap-1.5 relative z-10">
            <NavLinks isMobile={false} />
          </nav>

          {/* Direita: tema + CTA (desktop) ou menu (mobile) */}
          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              type="button"
              onClick={toggleTheme}
              className="header-btn-icon p-2.5 rounded-xl text-gray-500 dark:text-night-muted hover:text-olive dark:hover:text-accent-purpleLight"
              title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </motion.button>

            {isAdmin && (
              <Link
                href="/admin"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-olive/15 dark:bg-olive/25 text-olive dark:text-olive-light font-medium text-sm hover:bg-olive/25 dark:hover:bg-olive/35"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Painel</span>
              </Link>
            )}
            <Link
              href="/doctor"
              className="header-btn-cta hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm relative overflow-hidden"
            >
              <CalendarPlus className="h-4 w-4 relative z-10" />
              <span className="relative z-10">Agendar</span>
            </Link>

            <motion.button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="lg:hidden p-2.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-luxury-warmGray/50 dark:hover:bg-gray-700/50"
              aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
              whileTap={{ scale: 0.95 }}
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </motion.button>
          </div>
        </header>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-luxury-cream dark:bg-luxury-slate border-l border-luxury-warmGray/50 dark:border-gray-600/50 shadow-2xl lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between h-16 px-4 border-b border-luxury-warmGray/40 dark:border-gray-600/50">
                <span className="font-semibold text-gray-800 dark:text-gray-100">Menu</span>
                <button type="button" onClick={() => setMobileOpen(false)} className="p-2 rounded-xl hover:bg-gray-200/80 dark:hover:bg-gray-700/80" aria-label="Fechar">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                <NavLinks isMobile />
              </nav>
              <div className="p-4 border-t border-luxury-warmGray/40 dark:border-gray-600/50 space-y-2">
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-olive/15 dark:bg-olive/25 text-olive dark:text-olive-light font-medium"
                    onClick={() => setMobileOpen(false)}
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    Painel administrativo
                  </Link>
                )}
                <Link
                  href="/doctor"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-olive text-white font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  <CalendarPlus className="h-5 w-5" />
                  Agendar consulta
                </Link>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-luxury-warmGray/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300"
                >
                  {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  <span>{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
