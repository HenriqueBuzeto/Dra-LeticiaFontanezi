'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AdminLayout from './AdminLayout'

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

export function AdminLayoutWrapper({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/auth/login')
      return
    }
    if (user.role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [user, loading, router])

  if (loading) return <PageSkeleton />
  if (!user || user.role !== 'admin') return <PageSkeleton />

  return <AdminLayout>{children}</AdminLayout>
}
