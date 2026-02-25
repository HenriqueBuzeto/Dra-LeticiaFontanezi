import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToasterProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 left-4 right-4 z-[100] flex flex-col gap-2 safe-bottom md:left-auto md:right-6 md:max-w-sm">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="card-glass flex items-center gap-3 p-4"
            >
              {t.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />}
              {t.type === 'error' && <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />}
              {t.type === 'info' && <Info className="h-5 w-5 text-olive shrink-0" />}
              <p className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">{t.message}</p>
              <button type="button" onClick={() => remove(t.id)} className="p-1 rounded-lg hover:bg-gray-mist dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300" aria-label="Fechar notificação">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) return { toast: () => {} }
  return ctx
}

export function Toaster() {
  return null
}
