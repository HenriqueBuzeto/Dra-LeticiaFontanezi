import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import MainLayout from './MainLayout'
import { ARSimulatorErrorBoundary } from '@/components/ARSimulatorErrorBoundary'
import Dashboard from '@/pages/Dashboard'
import { ENABLE_AR_SIMULATOR, AR_ROUTE_PATH } from '@/features/ar/config'
import Videos from '@/pages/Videos'
import Appointments from '@/pages/Appointments'
import Profile from '@/pages/Profile'
import Doctor from '@/pages/Doctor'
import Reminders from '@/pages/Reminders'
import Pontos from '@/pages/Pontos'

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

const pageTransition = { type: 'tween', duration: 0.25 }

function ARSimulatorLoadError() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-night-bg flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-lg font-bold text-gray-800 dark:text-night-text mb-2">Simulador AR</h1>
        <p className="text-sm text-gray-600 dark:text-night-muted mb-4">
          Não foi possível carregar esta página. Tente recarregar ou volte ao início.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-olive text-white font-medium"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}

const LazyARSimulatorPage = lazy(() =>
  import('@/features/ar-elastic')
    .then((m) => ({ default: m.ElasticARPage }))
    .catch(() => ({ default: ARSimulatorLoadError }))
)

export function AnimatedRoutes() {
  const location = useLocation()

  return (
    <MainLayout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                <Dashboard />
              </motion.div>
            }
          />
          <Route
            path="/dashboard"
            element={
              <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                <Dashboard />
              </motion.div>
            }
          />
          {ENABLE_AR_SIMULATOR && (
            <Route
              path={AR_ROUTE_PATH}
              element={
                <ARSimulatorErrorBoundary>
                  <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                    <Suspense fallback={<div className="flex items-center justify-center p-8 min-h-[40vh]"><span className="text-gray-500">Carregando Simulador AR...</span></div>}>
                      <LazyARSimulatorPage />
                    </Suspense>
                  </motion.div>
                </ARSimulatorErrorBoundary>
              }
            />
          )}
          <Route
            path="/videos"
            element={
              <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                <Videos />
              </motion.div>
            }
          />
          <Route
            path="/appointments"
            element={
              <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                <Appointments />
              </motion.div>
            }
          />
          <Route
            path="/reminders"
            element={
              <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                <Reminders />
              </motion.div>
            }
          />
          <Route
            path="/pontos"
            element={
              <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                <Pontos />
              </motion.div>
            }
          />
          <Route
            path="/doctor"
            element={
              <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                <Doctor />
              </motion.div>
            }
          />
          <Route
            path="/profile"
            element={
              <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
                <Profile />
              </motion.div>
            }
          />
        </Routes>
      </AnimatePresence>
    </MainLayout>
  )
}
