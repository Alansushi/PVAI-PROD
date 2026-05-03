'use client'

import { useState } from 'react'
import type { AgentCardAction } from '@/lib/types'

interface Props {
  open: boolean
  action: AgentCardAction | null
  projectId: string
  onConfirm: () => void | Promise<void>
  onClose: () => void
}

function buildPreview(action: AgentCardAction): string {
  const p = action.payload as Record<string, unknown> | undefined
  if (!p) return action.label

  const name = p.name as string | undefined
  const bold = name ? `**${name}**` : '(entregable)'

  if (action.actionType === 'update') {
    const changes = p.changes as Record<string, unknown> | undefined
    const parts: string[] = []
    if (changes?.status) parts.push(`estado: ${changes.status}`)
    if (changes?.dueDate) parts.push(`fecha: ${changes.dueDate as string}`)
    const detail = parts.length ? ` → ${parts.join(', ')}` : ''
    return `Actualizar ${bold}${detail}`
  }

  if (action.actionType === 'reassign') {
    const owner = p.ownerName as string | undefined
    return `Reasignar ${bold} a ${owner ?? '(sin asignar)'}`
  }

  if (action.actionType === 'create') {
    const parts: string[] = []
    if (p.priority) parts.push(`prioridad: ${p.priority as string}`)
    if (p.ownerName) parts.push(`responsable: ${p.ownerName as string}`)
    if (p.dueDate) parts.push(`fecha: ${p.dueDate as string}`)
    const detail = parts.length ? ` (${parts.join(', ')})` : ''
    return `Crear entregable ${bold}${detail}`
  }

  if (action.actionType === 'note') {
    const note = p.note as string | undefined
    return `Agregar nota a ${bold}: ${note ?? ''}`
  }

  return action.label
}

function renderPreview(text: string) {
  return text.split('**').map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="text-white font-semibold">{part}</strong>
      : <span key={i}>{part}</span>
  )
}

export default function DryRunModal({ open, action, onConfirm, onClose }: Props) {
  const [loading, setLoading] = useState(false)

  if (!open || !action) return null

  const preview = buildPreview(action)

  async function handleConfirm() {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1C3448] border border-pv-accent/30 rounded-2xl w-full max-w-xs shadow-2xl p-5 animate-modalIn">
        <h2 className="font-display text-[14px] font-black text-white mb-1">
          Confirmar acción
        </h2>
        <p className="text-[11px] text-pv-gray mb-1">Se ejecutará lo siguiente:</p>
        <div className="bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-[11px] text-[#C0D0E0] mb-4 leading-relaxed">
          {renderPreview(preview)}
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-[11px] text-pv-gray mb-3">
            <svg className="animate-spin h-3 w-3 text-pv-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Ejecutando...
          </div>
        )}
        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3 py-1.5 text-[11px] font-semibold text-pv-gray border border-white/[0.1] rounded-lg hover:bg-white/[0.06] transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-pv-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pv-navy focus-visible:outline-none"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-1.5 text-[11px] font-semibold text-white bg-pv-accent hover:bg-pv-accent/80 rounded-lg transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-pv-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pv-navy focus-visible:outline-none"
          >
            {loading ? 'Confirmando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}
