'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  // Graceful fallback if used outside provider
  if (!ctx) return { showToast: () => {} }
  return ctx
}

const TYPE_STYLES: Record<ToastType, string> = {
  success: 'border-pv-green/40 text-pv-green',
  error:   'border-pv-red/40 text-pv-red',
  info:    'border-pv-accent/40 text-pv-accent',
}

const TYPE_ICON: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3200)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[600] flex flex-col items-center gap-2 pointer-events-none"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-4 py-2.5 rounded-xl text-[12px] font-semibold shadow-2xl border flex items-center gap-2 pointer-events-auto bg-[#0C2540] animate-modalIn whitespace-nowrap ${TYPE_STYLES[t.type]}`}
          >
            <span className="text-[14px] leading-none">{TYPE_ICON[t.type]}</span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
