'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, Scan, Video, Calendar, User, Bell, Award, Sparkles } from 'lucide-react'
import { ENABLE_AR_SIMULATOR, AR_ROUTE_PATH } from '@/features/ar/config'

const items = [
  { to: '/dashboard', icon: Home, label: 'Início' },
  ...(ENABLE_AR_SIMULATOR ? [{ to: AR_ROUTE_PATH, icon: Scan, label: 'AR' }] : []),
  { to: '/videos', icon: Video, label: 'Vídeos' },
  { to: '/appointments', icon: Calendar, label: 'Agenda' },
  { to: '/doctor', icon: Sparkles, label: 'Cuidados' },
  { to: '/reminders', icon: Bell, label: 'Lembretes' },
  { to: '/pontos', icon: Award, label: 'Pontos' },
  { to: '/profile', icon: User, label: 'Perfil' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200/80 dark:border-gray-700/80 shadow-[0_-2px_12px_rgba(0,0,0,0.04)] lg:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14 px-1 min-h-[56px]">
        {items.map(({ to, icon: Icon, label }) => {
          const href = to ?? '#'
          const isActive = pathname === href || (href === '/dashboard' && (pathname === '/' || pathname === '/dashboard'))
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center flex-1 min-w-0 py-1.5 relative rounded-xl active:scale-95 transition-transform"
            >
              {isActive && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0.5 rounded-xl bg-olive/10 dark:bg-olive/15"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                />
              )}
              <span className="relative flex flex-col items-center gap-0.5">
                <Icon
                  className={`h-5 w-5 shrink-0 ${isActive ? 'text-olive dark:text-olive-light' : 'text-gray-400 dark:text-gray-500'}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={`text-[9px] sm:text-[10px] font-medium truncate max-w-[48px] ${isActive ? 'text-olive dark:text-olive-light' : 'text-gray-400 dark:text-gray-500'}`}>
                  {label}
                </span>
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
