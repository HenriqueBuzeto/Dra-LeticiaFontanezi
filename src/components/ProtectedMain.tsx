'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { PointsProvider } from '@/contexts/PointsContext'
import MainLayout from '@/components/layout/MainLayout'

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

export function ProtectedMain({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/auth/login')
      return
    }
  }, [user, loading, router])

  if (loading) return <PageSkeleton />
  if (!user) return <PageSkeleton />

  return (
    <PointsProvider>
      <MainLayout>{children}</MainLayout>
    </PointsProvider>
  )
}
