'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { ReactNode, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ParticlesBackgroundPlaceholder from './ParticlesBackgroundPlaceholder'
import Header from './Header'
import BottomNav from './BottomNav'
import Footer from './Footer'
import { ENABLE_AR_SIMULATOR, AR_ROUTE_PATH } from '@/features/ar/config'

const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

const ParticlesBackground = dynamic(() => import('./ParticlesBackground'), {
  ssr: false,
  loading: () => <ParticlesBackgroundPlaceholder />,
})

const routesWithNav = [
  '/',
  '/dashboard',
  ...(ENABLE_AR_SIMULATOR ? [AR_ROUTE_PATH] : []),
  '/videos',
  '/appointments',
  '/reminders',
  '/pontos',
  '/profile',
  '/doctor',
]

const CONTENT_BG_IMAGE = 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200&q=75'

export default function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const showNav = routesWithNav.some((r) => r === pathname) || (pathname?.startsWith('/dashboard') ?? false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const m = window.matchMedia('(min-width: 1024px)')
    setIsDesktop(m.matches)
    const fn = () => setIsDesktop(m.matches)
    m.addEventListener('change', fn)
    return () => m.removeEventListener('change', fn)
  }, [])

  return (
    <div className="min-h-screen relative bg-transparent">
      <ParticlesBackground />

      <div className={`min-h-screen flex flex-col ${showNav ? 'pb-20 lg:pb-0 safe-bottom' : ''}`}>
        {/* Header só em desktop; no mobile a navegação é a barra inferior */}
        {showNav && (
          <div className="hidden lg:block">
            <Header />
          </div>
        )}

        {/* Desktop: margem generosa da borda da tela; mobile: padding normal */}
          <div className="flex-1 flex flex-col w-full min-h-0 relative z-10 scrollbar-modern items-center px-4 sm:px-6 lg:px-16 xl:px-24">
          {/* Desktop: fundo sutil só atrás do card (não cobre as partículas nas laterais) */}
          {isDesktop && showNav && (
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.04] dark:opacity-[0.03]"
                style={{ backgroundImage: `url(${CONTENT_BG_IMAGE})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-offwhite/50 via-transparent to-olive/6 dark:from-night-bg/30 dark:via-transparent dark:to-olive/10" />
            </div>
          )}

          {/* Container: mobile = padding aqui; desktop = só max-width (largura igual ao header) */}
          <div className="w-full mx-auto flex flex-col flex-1 min-h-0 lg:max-w-6xl xl:max-w-7xl">
            <main
              className={`flex-1 w-full flex flex-col items-center
                py-6 lg:py-8
                px-0 lg:px-10 xl:px-12
                lg:bg-offwhite/95 dark:lg:bg-night-surface lg:backdrop-blur-xl
                lg:shadow-[0_8px_40px_rgba(131,167,129,0.08)] dark:lg:shadow-[0_8px_40px_rgba(0,0,0,0.4)]
                lg:rounded-3xl lg:border lg:border-luxury-warmGray/50 dark:lg:border-night-border
                lg:my-6`}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={pathname ?? ''}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="h-full min-h-[50vh] w-full"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </main>

            {showNav && (
              <footer className="w-full mb-24 pb-6 lg:mb-6 lg:pb-0 lg:rounded-3xl lg:overflow-hidden lg:border lg:border-luxury-warmGray/40 dark:lg:border-night-border">
                <Footer />
              </footer>
            )}
          </div>
        </div>
      </div>

      {showNav && (
        <div className="lg:hidden">
          <BottomNav />
        </div>
      )}
    </div>
  )
}
