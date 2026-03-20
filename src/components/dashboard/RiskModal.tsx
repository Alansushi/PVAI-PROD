'use client'

import { useState, useEffect } from 'react'
import type { DBProjectRisk } from '@/lib/db-types'
import { useToast } from '@/lib/context/ToastContext'
import ConfirmDialog from '@/components/ui/confirm-dialog'

interface Props {
  open: boolean
  onClose: () => void
  projectId: string
  editingRisk?: DBProjectRisk | null
  onSaved: (risk: DBProjectRisk) => void
  onDeleted?: (id: string) => void
}

const LEVEL_OPTS = [
  { value: 'low',    label: 'Baja',   cls: 'bg-pv-green/20 text-pv-green' },
  { value: 'medium', label: 'Media',  cls: 'bg-pv-amber/20 text-pv-amber' },
  { value: 'high',   label: 'Alta',   cls: 'bg-pv-red/20 text-pv-red' },
]

const STATUS_OPTS = [
  { value: 'open',      label: 'Abierto',    cls: 'bg-pv-red/20 text-pv-red' },
  { value: 'mitigated', label: 'Mitigado',   cls: 'bg-pv-amber/20 text-pv-amber' },
  { value: 'closed',    label: 'Cerrado',    cls: 'bg-pv-green/20 text-pv-green' },
]

export default function RiskModal({ open, onClose, projectId, editingRisk, onSaved, onDeleted }: Props) {
  const isEditing = !!editingRisk
  const { showToast } = useToast()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [probability, setProbability] = useState<'low' | 'medium' | 'high'>('medium')
  const [impact, setImpact] = useState<'low' | 'medium' | 'high'>('medium')
  const [status, setStatus] = useState<'open' | 'mitigated' | 'closed'>('open')
  const [mitigation, setMitigation] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { setError(null) }, [open])

  useEffect(() => {
    if (!open) return
    if (editingRisk) {
      setTitle(editingRisk.title)
      setDescription(editingRisk.description ?? '')
      setProbability(editingRisk.probability)
      setImpact(editingRisk.impact)
      setStatus(editingRisk.status)
      setMitigation(editingRisk.mitigation ?? '')
      setOwnerName(editingRisk.ownerName ?? '')
    } else {
      setTitle(''); setDescription(''); setProbability('medium')
      setImpact('medium'); setStatus('open'); setMitigation(''); setOwnerName('')
    }
  }, [open, editingRisk])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true); setError(null)
    try {
      const body = { title: title.trim(), description: description.trim() || null, probability, impact, status, mitigation: mitigation.trim() || null, ownerName: ownerName.trim() || null }
      const url = isEditing ? `/api/projects/${projectId}/risks/${editingRisk!.id}` : `/api/projects/${projectId}/risks`
      const res = await fetch(url, { method: isEditing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) { setError('No se pudo guardar. Intenta de nuevo.'); return }
      onSaved(await res.json()); onClose()
      showToast(isEditing ? 'Riesgo actualizado' : 'Riesgo creado')
    } catch { setError('No se pudo guardar. Intenta de nuevo.') }
    finally { setLoading(false) }
  }

  async function handleDelete() {
    if (!editingRisk || !onDeleted) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/risks/${editingRisk.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      onDeleted(editingRisk.id); onClose()
      showToast('Riesgo eliminado', 'info')
    } catch { setError('No se pudo eliminar.') }
    finally { setDeleting(false); setConfirmOpen(false) }
  }

  if (!open) return null

  function LevelToggle({ value, onChange }: { value: string; onChange: (v: 'low' | 'medium' | 'high') => void }) {
    return (
      <div className="flex rounded-lg overflow-hidden border border-white/[0.1] text-[10px] font-bold">
        {LEVEL_OPTS.map(o => (
          <button key={o.value} type="button" onClick={() => onChange(o.value as 'low' | 'medium' | 'high')}
            className={`px-2.5 py-1 transition-colors ${value === o.value ? o.cls : 'text-pv-gray hover:bg-white/[0.05]'}`}>
            {o.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1C3448] border border-white/[0.12] rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0">
          <h2 className="font-display text-[16px] font-black text-white">
            {isEditing ? 'Editar riesgo' : 'Nuevo riesgo'}
          </h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-pv-gray hover:text-white hover:bg-white/10 transition-colors text-lg">×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex flex-col gap-4 px-5 py-4 overflow-y-auto flex-1">
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.5px] text-pv-gray">Título del riesgo *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
                placeholder="ej. Retraso en aprobación de planos..."
                className="w-full bg-white/[0.06] border border-white/[0.12] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-pv-gray/50 outline-none focus:border-pv-accent/60 transition-colors" />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.5px] text-pv-gray">Descripción</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                placeholder="Contexto adicional del riesgo..."
                className="w-full bg-white/[0.06] border border-white/[0.12] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-pv-gray/50 outline-none focus:border-pv-accent/60 transition-colors resize-none" />
            </div>

            {/* Probability + Impact */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.5px] text-pv-gray">Probabilidad</label>
                <LevelToggle value={probability} onChange={setProbability} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.5px] text-pv-gray">Impacto</label>
                <LevelToggle value={impact} onChange={setImpact} />
              </div>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.5px] text-pv-gray">Estado</label>
              <div className="flex rounded-lg overflow-hidden border border-white/[0.1] text-[10px] font-bold">
                {STATUS_OPTS.map(o => (
                  <button key={o.value} type="button" onClick={() => setStatus(o.value as typeof status)}
                    className={`flex-1 px-2 py-1.5 transition-colors ${status === o.value ? o.cls : 'text-pv-gray hover:bg-white/[0.05]'}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mitigation */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.5px] text-pv-gray">Plan de mitigación</label>
              <textarea value={mitigation} onChange={e => setMitigation(e.target.value)} rows={2}
                placeholder="¿Cómo se va a mitigar este riesgo?"
                className="w-full bg-white/[0.06] border border-white/[0.12] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-pv-gray/50 outline-none focus:border-pv-accent/60 transition-colors resize-none" />
            </div>

            {/* Owner */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.5px] text-pv-gray">Responsable</label>
              <input type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)}
                placeholder="Nombre del responsable del riesgo"
                className="w-full bg-white/[0.06] border border-white/[0.12] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-pv-gray/50 outline-none focus:border-pv-accent/60 transition-colors" />
            </div>
          </div>

          {error && (
            <div className="px-5 pb-2 flex-shrink-0">
              <p className="text-[11px] text-pv-red bg-pv-red/10 border border-pv-red/20 rounded-lg px-3 py-2">{error}</p>
            </div>
          )}

          <div className="px-5 py-3 border-t border-white/[0.08] flex items-center gap-2 flex-shrink-0">
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
            <button type="submit" disabled={loading || !title.trim()}
              className="px-4 py-1.5 text-[11px] font-semibold text-white bg-pv-accent hover:bg-pv-accent/80 rounded-lg transition-colors disabled:opacity-50">
              {loading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear riesgo'}
            </button>
          </div>
        </form>
      </div>
    </div>

      <ConfirmDialog
        open={confirmOpen}
        title="¿Eliminar riesgo?"
        description="Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
        loading={deleting}
      />
    </>
  )
}
