'use client'

import { useState, useEffect } from 'react'
import type { DBProjectKPI } from '@/lib/db-types'
import { useToast } from '@/lib/context/ToastContext'
import ConfirmDialog from '@/components/ui/confirm-dialog'

interface Props {
  open: boolean
  onClose: () => void
  projectId: string
  editingKPI?: DBProjectKPI | null
  onSaved: (kpi: DBProjectKPI) => void
  onDeleted?: (id: string) => void
}

export default function KPIModal({ open, onClose, projectId, editingKPI, onSaved, onDeleted }: Props) {
  const isEditing = !!editingKPI
  const { showToast } = useToast()
  const [title, setTitle] = useState('')
  const [target, setTarget] = useState('')
  const [current, setCurrent] = useState('')
  const [unit, setUnit] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { setError(null) }, [open])

  useEffect(() => {
    if (!open) return
    if (editingKPI) {
      setTitle(editingKPI.title)
      setTarget(String(editingKPI.target))
      setCurrent(String(editingKPI.current))
      setUnit(editingKPI.unit)
    } else {
      setTitle(''); setTarget(''); setCurrent('0'); setUnit('')
    }
  }, [open, editingKPI])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !target) return
    setLoading(true); setError(null)
    try {
      const body = { title: title.trim(), target: parseFloat(target), current: parseFloat(current || '0'), unit: unit.trim() }
      const url = isEditing ? `/api/projects/${projectId}/kpis/${editingKPI!.id}` : `/api/projects/${projectId}/kpis`
      const res = await fetch(url, { method: isEditing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) { setError('No se pudo guardar. Intenta de nuevo.'); return }
      onSaved(await res.json()); onClose()
      showToast(isEditing ? 'KPI actualizado' : 'KPI creado')
    } catch { setError('No se pudo guardar. Intenta de nuevo.') }
    finally { setLoading(false) }
  }

  async function handleDelete() {
    if (!editingKPI || !onDeleted) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/kpis/${editingKPI.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      onDeleted(editingKPI.id); onClose()
      showToast('KPI eliminado', 'info')
    } catch { setError('No se pudo eliminar.') }
    finally { setDeleting(false); setConfirmOpen(false) }
  }

  const pct = target && current ? Math.min(Math.round((parseFloat(current) / parseFloat(target)) * 100), 100) : 0
  const pctCls = pct >= 80 ? 'bg-pv-green' : pct >= 40 ? 'bg-pv-accent' : 'bg-pv-amber'

  if (!open) return null

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1C3448] border border-white/[0.12] rounded-2xl w-full max-w-sm shadow-2xl flex flex-col">
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0">
          <h2 className="font-display text-[16px] font-black text-white">
            {isEditing ? 'Editar KPI' : 'Nuevo KPI'}
          </h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-pv-gray hover:text-white hover:bg-white/10 transition-colors text-lg">×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="flex flex-col gap-4 px-5 py-4">
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.5px] text-pv-gray">Nombre del KPI *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
                placeholder="ej. Planos aprobados, Entregables completados..."
                className="w-full bg-white/[0.06] border border-white/[0.12] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-pv-gray/50 outline-none focus:border-pv-accent/60 transition-colors" />
            </div>

            {/* Target + Current + Unit */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.5px] text-pv-gray">Meta *</label>
                <input type="number" value={target} onChange={e => setTarget(e.target.value)} required min="0" step="any"
                  placeholder="100"
                  className="w-full bg-white/[0.06] border border-white/[0.12] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-pv-gray/50 outline-none focus:border-pv-accent/60 transition-colors" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.5px] text-pv-gray">Actual</label>
                <input type="number" value={current} onChange={e => setCurrent(e.target.value)} min="0" step="any"
                  placeholder="0"
                  className="w-full bg-white/[0.06] border border-white/[0.12] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-pv-gray/50 outline-none focus:border-pv-accent/60 transition-colors" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.5px] text-pv-gray">Unidad</label>
                <input type="text" value={unit} onChange={e => setUnit(e.target.value)}
                  placeholder="%, m², hrs"
                  className="w-full bg-white/[0.06] border border-white/[0.12] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-pv-gray/50 outline-none focus:border-pv-accent/60 transition-colors" />
              </div>
            </div>

            {/* Progress preview */}
            {target && (
              <div className="bg-white/[0.04] rounded-lg px-3 py-2.5">
                <div className="flex justify-between text-[10px] mb-1.5">
                  <span className="text-pv-gray">Vista previa</span>
                  <span className="font-bold text-white">{pct}%</span>
                </div>
                <div className="h-2 bg-white/[0.08] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${pctCls}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="text-[10px] text-pv-gray/60 mt-1">
                  {current || '0'}{unit ? ` ${unit}` : ''} / {target}{unit ? ` ${unit}` : ''}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="px-5 pb-2">
              <p className="text-[11px] text-pv-red bg-pv-red/10 border border-pv-red/20 rounded-lg px-3 py-2">{error}</p>
            </div>
          )}

          <div className="px-5 py-3 border-t border-white/[0.08] flex items-center gap-2">
            {isEditing && onDeleted && (
              <button type="button" onClick={() => setConfirmOpen(true)} disabled={deleting}
                className="px-3 py-1.5 text-[11px] font-semibold text-pv-red border border-pv-red/30 rounded-lg hover:bg-pv-red/10 transition-colors disabled:opacity-50 mr-auto">
                Eliminar
              </button>
            )}
            <button type="button" onClick={onClose}
              className="px-3 py-1.5 text-[11px] font-semibold text-pv-gray border border-white/[0.1] rounded-lg hover:bg-white/[0.06] transition-colors ml-auto">
              Cancelar
            </button>
            <button type="submit" disabled={loading || !title.trim() || !target}
              className="px-4 py-1.5 text-[11px] font-semibold text-white bg-pv-accent hover:bg-pv-accent/80 rounded-lg transition-colors disabled:opacity-50">
              {loading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear KPI'}
            </button>
          </div>
        </form>
      </div>
    </div>
    <ConfirmDialog
      open={confirmOpen}
      title="¿Eliminar KPI?"
      description="Esta acción no se puede deshacer."
      onConfirm={handleDelete}
      onCancel={() => setConfirmOpen(false)}
      loading={deleting}
    />
    </>
  )
}
