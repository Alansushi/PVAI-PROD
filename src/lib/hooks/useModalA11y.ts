'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Stack global de modales abiertos: solo el superior responde a Escape/Tab
// (evita que un ConfirmDialog anidado cierre también al modal padre)
const modalStack: symbol[] = []

interface UseModalA11yOptions {
  onClose: () => void
  /** Debe reflejar el estado `open` del modal (los hooks no pueden ser condicionales) */
  enabled?: boolean
  /** Bloquea el cierre (backdrop/Escape) mientras hay un submit en vuelo */
  loading?: boolean
  /** Si true, pide confirmación antes de descartar cambios */
  trackDirty?: boolean
  /** Dirty controlado externamente (se combina con el tracking automático) */
  dirty?: boolean
}

/**
 * Accesibilidad estándar para modales custom:
 * - Escape cierra (con confirmación si hay cambios sin guardar)
 * - Focus trap dentro del modal + retorno de foco al disparador
 * - Scroll-lock del body mientras está abierto
 * - `requestClose` para el backdrop: ignora clicks durante loading y
 *   confirma si el formulario tiene cambios (marcados vía `dialogProps.onInput`)
 */
export function useModalA11y({
  onClose,
  enabled = true,
  loading = false,
  trackDirty = false,
  dirty: controlledDirty = false,
}: UseModalA11yOptions) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [dirty, setDirty] = useState(false)

  const loadingRef = useRef(loading)
  loadingRef.current = loading
  const dirtyRef = useRef(false)
  dirtyRef.current = (trackDirty && dirty) || controlledDirty

  const requestClose = useCallback(() => {
    if (loadingRef.current) return
    if (dirtyRef.current && !window.confirm('Hay cambios sin guardar. ¿Cerrar de todas formas?')) return
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!enabled) return
    setDirty(false)
    const modalId = Symbol('modal')
    modalStack.push(modalId)
    const previouslyFocused = document.activeElement as HTMLElement | null

    // Foco inicial dentro del modal
    const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
    focusables?.[0]?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (modalStack[modalStack.length - 1] !== modalId) return
      if (e.key === 'Escape') {
        e.stopPropagation()
        requestClose()
        return
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
        if (!items.length) return
        const first = items[0]
        const last = items[items.length - 1]
        const active = document.activeElement
        if (e.shiftKey && (active === first || !dialogRef.current.contains(active))) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && (active === last || !dialogRef.current.contains(active))) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      const idx = modalStack.indexOf(modalId)
      if (idx !== -1) modalStack.splice(idx, 1)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = prevOverflow
      previouslyFocused?.focus?.()
    }
  }, [enabled, requestClose])

  const markDirty = useCallback(() => setDirty(true), [])

  return {
    requestClose,
    markDirty,
    dialogProps: {
      ref: dialogRef,
      role: 'dialog' as const,
      'aria-modal': true as const,
      onInput: trackDirty ? markDirty : undefined,
    },
  }
}
