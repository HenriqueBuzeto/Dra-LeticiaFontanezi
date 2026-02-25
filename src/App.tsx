import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { PointsProvider } from '@/contexts/PointsContext'
import { AnimatedRoutes } from '@/components/layout/AnimatedRoutes'
import { AdminRoute } from '@/components/admin/AdminRoute'
import AdminLayout from '@/components/admin/AdminLayout'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminVideos from '@/pages/admin/AdminVideos'
import AdminAgenda from '@/pages/admin/AdminAgenda'
import AdminLembretes from '@/pages/admin/AdminLembretes'
import AdminRecompensas from '@/pages/admin/AdminRecompensas'
import AdminUsuarios from '@/pages/admin/AdminUsuarios'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <PageSkeleton />
  if (!user) return <Navigate to="/auth/login" replace />
  return <PointsProvider>{children}</PointsProvider>
}

function PageSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-300 dark:bg-gray-600" />
        <div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded" />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminRoute />
            </ProtectedRoute>
          }
        >
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="videos" element={<AdminVideos />} />
            <Route path="agenda" element={<AdminAgenda />} />
            <Route path="lembretes" element={<AdminLembretes />} />
            <Route path="recompensas" element={<AdminRecompensas />} />
            <Route path="usuarios" element={<AdminUsuarios />} />
          </Route>
        </Route>
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AnimatedRoutes />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}
