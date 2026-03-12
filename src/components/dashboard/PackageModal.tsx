'use client'

import { useState, useEffect, useRef } from 'react'
import type { DBDeliverablePackage, DBDeliverable } from '@/lib/db-types'

interface MilestoneForm {
  type: 'pre-entrega' | 'final'
  date: string
  label: string
}

interface Props {
  open: boolean
  onClose: () => void
  projectId: string
  deliverables: Pick<DBDeliverable, 'id' | 'name' | 'status'>[]
  editingPackage?: DBDeliverablePackage | null
  onSaved: (pkg: DBDeliverablePackage) => void
  onDeleted?: (id: string) => void
}

const STATUS_DOT: Record<string, string> = {
  ok: 'bg-pv-green',
  warn: 'bg-pv-amber',
  danger: 'bg-pv-red',
}

export default function PackageModal({
  open,
  onClose,
  projectId,
  deliverables,
  editingPackage,
  onSaved,
  onDeleted,
}: Props) {
  const isEditing = !!editingPackage

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [milestones, setMilestones] = useState<MilestoneForm[]>([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [delvOpen, setDelvOpen] = useState(false)
  const delvRef = useRef<HTMLDivElement>(null)

  const activeDeliverables = deliverables.filter(d => d.status === 'warn' || d.status === 'danger')

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (delvRef.current && !delvRef.current.contains(e.target as Node)) {
        setDelvOpen(false)
      }
    }
    if (delvOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [delvOpen])

  useEffect(() => { setError(null) }, [open])

  useEffect(() => {
    if (!open) return
    if (editingPackage) {
      setName(editingPackage.name)
      setDescription(editingPackage.description ?? '')
      setSelectedIds(editingPackage.deliverables.map(d => d.id))
      setMilestones(
        editingPackage.milestones.map(m => ({
          type: m.type,
          date: new Date(m.date).toISOString().slice(0, 10),
          label: m.label ?? '',
        })),
      )
    } else {
      setName('')
      setDescription('')
      setSelectedIds([])
      setMilestones([])
    }
  }, [open, editingPackage])

  function toggleDeliverable(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    )
  }

  function addMilestone() {
    setMilestones(prev => [...prev, { type: 'pre-entrega', date: '', label: '' }])
  }

  function removeMilestone(idx: number) {
    setMilestones(prev => prev.filter((_, i) => i !== idx))
  }

  function updateMilestone(idx: number, patch: Partial<MilestoneForm>) {
    setMilestones(prev => prev.map((m, i) => (i === idx ? { ...m, ...patch } : m)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)
    try {
      const body = {
        name: name.trim(),
        description: description.trim() || null,
        deliverableIds: selectedIds,
        milestones: milestones.filter(m => m.date).map(m => ({
          type: m.type,
          date: m.date,
          label: m.label.trim() || undefined,
        })),
      }

      const url = isEditing
        ? `/api/projects/${projectId}/packages/${editingPackage!.id}`
        : `/api/projects/${projectId}/packages`
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        setError('No se pudo guardar. Intenta de nuevo.')
        return
      }
      const saved = await res.json()
      onSaved(saved)
      onClose()
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!editingPackage || !onDeleted) return
    setDeleting(true)
    try {
      const res = await fetch(
        `/api/projects/${projectId}/packages/${editingPackage.id}`,
        { method: 'DELETE' },
      )
      if (!res.ok) throw new Error(await res.text())
      onDeleted(editingPackage.id)
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1C3448] border border-white/[0.12] rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0">
          <h2 className="font-display text-[16px] font-black text-white">
            {isEditing ? 'Editar paquete' : 'Nuevo paquete'}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-pv-gray hover:text-white hover:bg-white/10 transition-colors text-lg"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex flex-col gap-5 px-5 py-4 overflow-y-auto flex-1">
            {/* Section 1: Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.5px] text-pv-gray">
                Nombre del paquete
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="ej. Módulo 1, Fase de diseño..."
                className="w-full bg-white/[0.06] border border-white/[0.12] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-pv-gray/50 outline-none focus:border-pv-accent/60 transition-colors"
                required
              />
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Descripción opcional"
                className="w-full bg-white/[0.06] border border-white/[0.12] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-pv-gray/50 outline-none focus:border-pv-accent/60 transition-colors"
              />
            </div>

            {/* Section 2: Deliverables dropdown */}
            <div className="flex flex-col gap-1.5" ref={delvRef}>
              <label className="text-[10px] font-bold uppercase tracking-[0.5px] text-pv-gray">
                Entregables
              </label>

              {/* Trigger */}
              <button
                type="button"
                onClick={() => setDelvOpen(p => !p)}
                disabled={activeDeliverables.length === 0}
                className="w-full flex items-center justify-between px-3 py-2 bg-white/[0.06] border border-white/[0.12] rounded-lg text-[12px] transition-colors hover:bg-white/[0.09] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className={selectedIds.length > 0 ? 'text-white' : 'text-pv-gray/50'}>
                  {activeDeliverables.length === 0
                    ? 'Sin entregables activos'
                    : selectedIds.length > 0
                    ? `${selectedIds.length} seleccionado${selectedIds.length > 1 ? 's' : ''}`
                    : 'Seleccionar entregables...'}
                </span>
                <span className={`text-pv-gray text-[10px] transition-transform duration-150 ${delvOpen ? 'rotate-180' : ''}`}>▾</span>
              </button>

              {/* Dropdown list */}
              {delvOpen && (
                <div className="border border-white/[0.12] rounded-lg bg-[#152B3E] overflow-hidden shadow-lg">
                  <div className="overflow-y-auto" style={{ maxHeight: '148px' }}>
                    {activeDeliverables.map(d => (
                      <label
                        key={d.id}
                        className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/[0.06] cursor-pointer transition-colors border-b border-white/[0.05] last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(d.id)}
                          onChange={() => toggleDeliverable(d.id)}
                          className="w-3.5 h-3.5 rounded accent-pv-accent flex-shrink-0"
                        />
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[d.status] ?? 'bg-pv-gray'}`} />
                        <span className="text-[12px] text-white/90 truncate">{d.name}</span>
                        <span className={`ml-auto text-[9px] font-bold flex-shrink-0 ${d.status === 'danger' ? 'text-pv-red' : 'text-pv-amber'}`}>
                          {d.status === 'danger' ? 'En riesgo' : 'En proceso'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected chips */}
              {selectedIds.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {selectedIds.map(id => {
                    const d = activeDeliverables.find(x => x.id === id)
                    if (!d) return null
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 pl-2 pr-1 py-0.5 rounded-full bg-white/[0.08] border border-white/[0.10] text-[11px] text-white/80"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[d.status] ?? 'bg-pv-gray'}`} />
                        <span className="max-w-[120px] truncate">{d.name}</span>
                        <button
                          type="button"
                          onClick={() => toggleDeliverable(id)}
                          className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-white/20 text-pv-gray hover:text-white transition-colors text-[11px] leading-none flex-shrink-0"
                        >
                          ×
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Section 3: Milestones */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-[0.5px] text-pv-gray">
                  Fechas clave
                </label>
                <button
                  type="button"
                  onClick={addMilestone}
                  className="text-[10px] font-semibold text-pv-accent hover:text-pv-accent/80 transition-colors"
                >
                  + Agregar fecha
                </button>
              </div>

              {milestones.length === 0 && (
                <p className="text-[11px] text-pv-gray/50 italic">Sin fechas clave aún.</p>
              )}

              <div className="flex flex-col gap-2">
                {milestones.map((m, idx) => (
                  <div
                    key={idx}
                    className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-2">
                      {/* Type toggle */}
                      <div className="flex rounded-lg overflow-hidden border border-white/[0.1] text-[10px] font-bold flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => updateMilestone(idx, { type: 'pre-entrega' })}
                          className={`px-2 py-1 transition-colors ${
                            m.type === 'pre-entrega'
                              ? 'bg-pv-amber/25 text-pv-amber'
                              : 'text-pv-gray hover:bg-white/[0.05]'
                          }`}
                        >
                          Pre-entrega
                        </button>
                        <button
                          type="button"
                          onClick={() => updateMilestone(idx, { type: 'final' })}
                          className={`px-2 py-1 transition-colors ${
                            m.type === 'final'
                              ? 'bg-pv-accent/25 text-pv-accent'
                              : 'text-pv-gray hover:bg-white/[0.05]'
                          }`}
                        >
                          Final
                        </button>
                      </div>

                      {/* Date */}
                      <input
                        type="date"
                        value={m.date}
                        onChange={e => updateMilestone(idx, { date: e.target.value })}
                        className="flex-1 bg-white/[0.06] border border-white/[0.12] rounded-lg px-2 py-1 text-[12px] text-white outline-none focus:border-pv-accent/60 transition-colors"
                      />

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeMilestone(idx)}
                        className="w-6 h-6 flex items-center justify-center text-pv-gray hover:text-pv-red transition-colors text-base flex-shrink-0"
                      >
                        ×
                      </button>
                    </div>

                    {/* Label */}
                    <input
                      type="text"
                      value={m.label}
                      onChange={e => updateMilestone(idx, { label: e.target.value })}
                      placeholder='ej. Entrega Rev. 1 (opcional)'
                      className="w-full bg-white/[0.06] border border-white/[0.10] rounded-lg px-2 py-1 text-[11px] text-white placeholder:text-pv-gray/40 outline-none focus:border-pv-accent/50 transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="px-5 pb-2 flex-shrink-0">
              <p className="text-[11px] text-pv-red bg-pv-red/10 border border-pv-red/20 rounded-lg px-3 py-2">
                {error}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="px-5 py-3 border-t border-white/[0.08] flex items-center gap-2 flex-shrink-0">
            {isEditing && onDeleted && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 text-[11px] font-semibold text-pv-red border border-pv-red/30 rounded-lg hover:bg-pv-red/10 transition-colors disabled:opacity-50 mr-auto"
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-[11px] font-semibold text-pv-gray border border-white/[0.1] rounded-lg hover:bg-white/[0.06] transition-colors ml-auto"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-1.5 text-[11px] font-semibold text-white bg-pv-accent hover:bg-pv-accent/80 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear paquete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
