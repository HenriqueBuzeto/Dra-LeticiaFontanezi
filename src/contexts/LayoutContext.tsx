import { createContext, useContext, useState, ReactNode } from 'react'

interface LayoutContextType {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void
}

const LayoutContext = createContext<LayoutContextType | null>(null)

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  return (
    <LayoutContext.Provider value={{ sidebarCollapsed, setSidebarCollapsed }}>
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayout() {
  const ctx = useContext(LayoutContext)
  if (!ctx) return { sidebarCollapsed: false, setSidebarCollapsed: () => {} }
  return ctx
}
