'use client'

import { ReactNode } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { LayoutProvider } from '@/contexts/LayoutContext'
import { ToasterProvider } from '@/components/ui/Toaster'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LayoutProvider>
          <ToasterProvider>
            {children}
          </ToasterProvider>
        </LayoutProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}
