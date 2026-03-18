'use client'

import { useState, useEffect } from 'react'
import type { DBProject } from '@/lib/db-types'

interface Props {
  open: boolean
  onClose: () => void
  project: DBProject
  onSaved: (updated: DBProject) => void
}

const STATUS_OPTS = [
  { value: 'ok',     label: 'En curso',  cls: 'bg-pv-green/20 text-pv-green' },
  { value: 'warn',   label: 'En riesgo', cls: 'bg-pv-amber/20 text-pv-amber' },
  { value: 'danger', label: 'Crítico',   cls: 'bg-pv-red/20 text-pv-red' },
]

function toInputDate(d: Date | string | null): string {
  if (!d) return ''
  return new Date(d).toISOString().slice(0, 10)
}

export default function ProjectEditModal({ open, onClose, project, onSaved }: Props) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('warn')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [budget, setBudget] = useState('')
  const [billedAmount, setBilledAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTitle(project.title)
    setType(project.type)
    setStatus(project.status)
    setStartDate(toInputDate(project.startDate))
    setEndDate(toInputDate(project.endDate))
    setBudget(project.budget != null ? String(project.budget) : '')
    setBilledAmount(project.billedAmount != null ? String(project.billedAmount) : '')
    setError(null)
  }, [open, project])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true); setError(null)
    try {
      const body = {
        title: title.trim(),
        type: type.trim() || undefined,
        status,
        startDate: startDate || null,
        endDate: endDate || null,
        budget: budget !== '' ? Number(budget) : null,
        billedAmount: billedAmount !== '' ? Number(billedAmount) : null,
      }
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { setError('No se pudo guardar. Intenta de nuevo.'); return }
      const updated = await res.json()
      onSaved(updated)
      onClose()
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1C3448] border border-white/[0.12] rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0">
          <h2 className="font-display text-[16px] font-black text-white">Editar proyecto</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-pv-gray hover:text-white hover:bg-white/10 transition-colors text-lg">×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex flex-col gap-4 px-5 py-4 overflow-y-auto flex-1">
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.5px] text-pv-gray">Nombre del proyecto *</label>
              <input
                type="text" value={title} onChange={e => setTitle(e.target.value)} required
                className="w-full bg-white/[0.06] border border-white/[0.12] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-pv-gray/50 outline-none focus:border-pv-accent/60 transition-colors"
              />
            </div>

            {/* Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.5px] text-pv-gray">Tipo</label>
              <input
                type="text" value={type} onChange={e => setType(e.target.value)}
                placeholder="ej. Diseño arquitectónico, Construcción..."
                className="w-full bg-white/[0.06] border border-white/[0.12] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-pv-gray/50 outline-none focus:border-pv-accent/60 transition-colors"
              />
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.5px] text-pv-gray">Estado</label>
              <div className="flex rounded-lg overflow-hidden border border-white/[0.1] text-[10px] font-bold">
                {STATUS_OPTS.map(o => (
                  <button key={o.value} type="button" onClick={() => setStatus(o.value)}
                    className={`flex-1 px-2 py-1.5 transition-colors ${status === o.value ? o.cls : 'text-pv-gray hover:bg-white/[0.05]'}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.5px] text-pv-gray">Fecha inicio</label>
                <input
                  type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-white/[0.06] border border-white/[0.12] rounded-lg px-3 py-2 text-[13px] text-white outline-none focus:border-pv-accent/60 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.5px] text-pv-gray">Fecha fin</label>
                <input
                  type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="w-full bg-white/[0.06] border border-white/[0.12] rounded-lg px-3 py-2 text-[13px] text-white outline-none focus:border-pv-accent/60 transition-colors"
                />
              </div>
            </div>

            {/* Budget */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.5px] text-pv-gray">Presupuesto</label>
                <input
                  type="number" min="0" step="0.01" value={budget} onChange={e => setBudget(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white/[0.06] border border-white/[0.12] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-pv-gray/50 outline-none focus:border-pv-accent/60 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.5px] text-pv-gray">Facturado</label>
                <input
                  type="number" min="0" step="0.01" value={billedAmount} onChange={e => setBilledAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white/[0.06] border border-white/[0.12] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-pv-gray/50 outline-none focus:border-pv-accent/60 transition-colors"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="px-5 pb-2 flex-shrink-0">
              <p className="text-[11px] text-pv-red bg-pv-red/10 border border-pv-red/20 rounded-lg px-3 py-2">{error}</p>
            </div>
          )}

          <div className="px-5 py-3 border-t border-white/[0.08] flex items-center gap-2 flex-shrink-0">
            <button type="button" onClick={onClose}
              className="px-3 py-1.5 text-[11px] font-semibold text-pv-gray border border-white/[0.1] rounded-lg hover:bg-white/[0.06] transition-colors ml-auto">
              Cancelar
            </button>
            <button type="submit" disabled={loading || !title.trim()}
              className="px-4 py-1.5 text-[11px] font-semibold text-white bg-pv-accent hover:bg-pv-accent/80 rounded-lg transition-colors disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
