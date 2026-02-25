'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Scan, Video, Calendar, User, Bell, ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useLayout } from '@/contexts/LayoutContext'
import { motion, AnimatePresence } from 'framer-motion'

const items = [
  { to: '/dashboard', icon: Home, label: 'Início' },
  { to: '/ar-simulator', icon: Scan, label: 'Simulador AR' },
  { to: '/videos', icon: Video, label: 'Vídeos' },
  { to: '/appointments', icon: Calendar, label: 'Agenda' },
  { to: '/reminders', icon: Bell, label: 'Lembretes' },
  { to: '/profile', icon: User, label: 'Perfil' },
]

const SIDEBAR_WIDTH_EXPANDED = 240
const SIDEBAR_WIDTH_COLLAPSED = 72

export default function Sidebar() {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const { sidebarCollapsed: collapsed, setSidebarCollapsed: setCollapsed } = useLayout()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const isActive = (to: string) =>
    pathname === to || (to === '/dashboard' && (pathname === '/' || pathname === '/dashboard'))

  return (
    <aside
      className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:transition-[width] duration-200 ease-out
        min-w-0 overflow-x-hidden overflow-y-auto
        bg-luxury-cream/95 dark:bg-luxury-slate/98 backdrop-blur-xl
        border-r border-luxury-warmGray/50 dark:border-gray-600/50
        shadow-[4px_0_24px_-4px_rgba(131,167,129,0.08)] dark:shadow-[4px_0_24px_-4px_rgba(0,0,0,0.25)]"
      style={{ width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED }}
    >
      {/* Faixa sutil de gradiente no topo */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-olive/5 dark:from-olive/10 to-transparent pointer-events-none" aria-hidden="true" />

      {/* Header: logo + nome */}
      <div className="relative flex items-center gap-3 px-4 min-h-[4.5rem] shrink-0 border-b border-luxury-warmGray/40 dark:border-gray-600/50 py-2">
        <motion.img
          src="/Logo.png"
          alt="Dra. Letícia Fontanezi"
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-contain shrink-0 shadow-[0_4px_12px_rgba(131,167,129,0.25)] dark:shadow-[0_4px_12px_rgba(131,167,129,0.2)]"
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        />
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="font-semibold text-gray-800 dark:text-gray-100 whitespace-nowrap overflow-hidden"
            >
              Dra. Letícia
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 min-h-0 py-4 px-3 space-y-1 overflow-x-hidden overflow-y-auto">
        {items.map(({ to, icon: Icon, label }, index) => {
          const active = isActive(to)
          const showTooltip = collapsed && (hoveredItem === to || active)
          return (
            <motion.div
              key={to}
              className="relative"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
            >
              <Link
                href={to ?? '#'}
                onMouseEnter={() => setHoveredItem(to)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  collapsed ? 'justify-center px-0 py-3' : 'px-3 py-3'
                } ${
                  active
                    ? 'bg-olive/12 dark:bg-olive/20 text-olive dark:text-olive-light shadow-[inset_0_0_0_1px_rgba(131,167,129,0.12)] dark:shadow-[inset_0_0_0_1px_rgba(131,167,129,0.2)]'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-luxury-warmGray/50 dark:hover:bg-gray-700/60 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-olive dark:bg-olive-light"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <motion.span
                  className="flex items-center gap-3 w-full relative z-0"
                  whileHover={{ x: collapsed ? 0 : 4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <span className={active ? 'text-olive dark:text-olive-light' : ''}>
                    <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
                  </span>
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="whitespace-nowrap"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.span>
              </Link>
              <AnimatePresence>
                {showTooltip && (
                  <motion.div
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-2 rounded-xl bg-gray-900 dark:bg-luxury-slate text-white text-sm font-medium whitespace-nowrap z-50 shadow-lg border border-gray-700/50 pointer-events-none"
                  >
                    {label}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </nav>

      {/* Footer: colapsar + tema */}
      <div className="relative shrink-0 p-3 border-t border-luxury-warmGray/40 dark:border-gray-600/50 space-y-1 bg-gradient-to-t from-luxury-warmGray/20 dark:from-black/20 to-transparent">
        <motion.button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-olive/10 dark:hover:bg-olive/15 hover:text-olive dark:hover:text-olive-light transition-colors"
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          whileHover={{ x: collapsed ? 0 : 2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5 shrink-0 mx-auto" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5 shrink-0" />
              Recolher
            </>
          )}
        </motion.button>
        <motion.button
          type="button"
          onClick={toggleTheme}
          className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
            collapsed ? 'justify-center' : ''
          } text-gray-600 dark:text-gray-400 hover:bg-olive/10 dark:hover:bg-olive/15 hover:text-olive dark:hover:text-olive-light`}
          title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          whileHover={{ x: collapsed ? 0 : 2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
          {!collapsed && <span>{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}</span>}
        </motion.button>
      </div>
    </aside>
  )
}
