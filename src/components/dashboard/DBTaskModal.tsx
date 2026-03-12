'use client'

import { useState, useEffect } from 'react'
import type { DBDeliverable, DBProjectMember } from '@/lib/db-types'
import { toDateInput } from '@/lib/dates'

interface Props {
  open: boolean
  onClose: () => void
  projectId: string
  editingDeliverable?: DBDeliverable | null
  defaultStatus?: 'ok' | 'warn' | 'danger'
  onSaved: (deliverable: DBDeliverable) => void
  onDeleted?: (id: string) => void
  members?: DBProjectMember[]
}

type Status = 'ok' | 'warn' | 'danger'
type Priority = 'alta' | 'media' | 'baja'

const STATUS_OPTS: { key: Status; label: string; cls: string; activeCls: string }[] = [
  { key: 'ok',     label: '✓ Completa',   cls: 'border-white/10 text-pv-gray',   activeCls: 'bg-pv-green/20 border-pv-green/50 text-pv-green' },
  { key: 'warn',   label: '⏳ En proceso', cls: 'border-white/10 text-pv-gray',   activeCls: 'bg-pv-amber/20 border-pv-amber/50 text-pv-amber' },
  { key: 'danger', label: '🔴 En riesgo',  cls: 'border-white/10 text-pv-gray',   activeCls: 'bg-pv-red/20 border-pv-red/50 text-pv-red' },
]

const PRIORITY_OPTS: { key: Priority; label: string; color: string; activeCls: string }[] = [
  { key: 'alta',  label: 'Alta',  color: '#D94F4F', activeCls: 'bg-pv-red/20 border-pv-red/50 text-pv-red' },
  { key: 'media', label: 'Media', color: '#E09B3D', activeCls: 'bg-pv-amber/20 border-pv-amber/50 text-pv-amber' },
  { key: 'baja',  label: 'Baja',  color: '#2A9B6F', activeCls: 'bg-pv-green/20 border-pv-green/50 text-pv-green' },
]


export default function DBTaskModal({
  open,
  onClose,
  projectId,
  editingDeliverable,
  defaultStatus = 'warn',
  onSaved,
  onDeleted,
  members = [],
}: Props) {
  const isEditing = !!editingDeliverable

  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [form, setForm] = useState({
    name: '',
    status: defaultStatus as Status,
    priority: 'media' as Priority,
    ownerName: '',
    startDate: '',
    dueDate: '',
    notes: '',
  })

  // Reset error when modal opens/closes
  useEffect(() => { setError(null) }, [open])

  // Sync form when editing deliverable changes
  useEffect(() => {
    if (editingDeliverable) {
      // Try to match existing ownerId to a member
      const matchedMember = editingDeliverable.ownerId
        ? members.find(m => m.userId === editingDeliverable.ownerId) ?? null
        : null
      setSelectedMemberId(matchedMember ? matchedMember.id : '')
      setForm({
        name: editingDeliverable.name,
        status: editingDeliverable.status as Status,
        priority: (editingDeliverable.priority ?? 'media') as Priority,
        ownerName: editingDeliverable.ownerName ?? '',
        startDate: toDateInput(editingDeliverable.startDate),
        dueDate: toDateInput(editingDeliverable.dueDate),
        notes: editingDeliverable.notes ?? '',
      })
    } else {
      setSelectedMemberId('')
      setForm({
        name: '',
        status: defaultStatus,
        priority: 'media',
        ownerName: '',
        startDate: '',
        dueDate: '',
        notes: '',
      })
    }
  }, [editingDeliverable, defaultStatus, open])

  if (!open) return null

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    setError(null)
    try {
      // Resolve owner from dropdown or manual input
      let ownerName: string | null = form.ownerName || null
      let ownerId: string | null = null
      if (members.length > 0 && selectedMemberId && selectedMemberId !== '__other__') {
        const member = members.find(m => m.id === selectedMemberId)
        if (member) {
          ownerName = member.name
          ownerId = member.userId ?? null
        }
      }

      const payload = {
        name: form.name.trim(),
        status: form.status,
        priority: form.priority,
        ownerName,
        ownerId,
        startDate: form.startDate || null,
        dueDate: form.dueDate || null,
        notes: form.notes || null,
      }

      let res: Response
      if (isEditing) {
        res = await fetch(`/api/projects/${projectId}/deliverables/${editingDeliverable!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch(`/api/projects/${projectId}/deliverables`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (res.ok) {
        const saved = await res.json()
        // Ensure dates are Date objects
        if (saved.dueDate) saved.dueDate = new Date(saved.dueDate)
        if (saved.startDate) saved.startDate = new Date(saved.startDate)
        if (saved.createdAt) saved.createdAt = new Date(saved.createdAt)
        if (saved.updatedAt) saved.updatedAt = new Date(saved.updatedAt)
        onSaved(saved as DBDeliverable)
        onClose()
      } else {
        setError('No se pudo guardar. Intenta de nuevo.')
      }
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!isEditing) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/deliverables/${editingDeliverable!.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        onDeleted?.(editingDeliverable!.id)
        onClose()
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 bg-[#0C1F35] border border-white/[0.10] rounded-2xl p-6 w-[420px] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-[17px] font-bold text-white mb-5">
          {isEditing ? 'Editar entregable' : 'Nueva tarea'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Nombre */}
          <div>
            <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-1 block">
              Nombre *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Planos estructurales"
              className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-pv-gray/50 outline-none focus:border-pv-accent/50 transition-colors"
            />
          </div>

          {/* Estado */}
          <div>
            <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-1.5 block">Estado</label>
            <div className="flex gap-2">
              {STATUS_OPTS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => set('status', opt.key)}
                  className={`flex-1 px-2 py-1.5 text-[10px] font-semibold border rounded-lg transition-colors ${
                    form.status === opt.key ? opt.activeCls : opt.cls + ' hover:bg-white/[0.04]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prioridad */}
          <div>
            <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-1.5 block">Prioridad</label>
            <div className="flex gap-2">
              {PRIORITY_OPTS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => set('priority', opt.key)}
                  className={`flex-1 px-2 py-1.5 text-[10px] font-semibold border rounded-lg transition-colors flex items-center justify-center gap-1 ${
                    form.priority === opt.key ? opt.activeCls : 'border-white/10 text-pv-gray hover:bg-white/[0.04]'
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: opt.color }}
                  />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Responsable */}
          <div>
            <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-1 block">
              Responsable
            </label>
            {members.length > 0 ? (
              <div className="flex flex-col gap-2">
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full bg-[#0C1F35] border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white outline-none focus:border-pv-accent/50 transition-colors cursor-pointer"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="">Sin asignar</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name} — {m.role}</option>
                  ))}
                </select>
              </div>
            ) : (
              <input
                type="text"
                value={form.ownerName}
                onChange={(e) => set('ownerName', e.target.value)}
                placeholder="Ana Torres"
                className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-pv-gray/50 outline-none focus:border-pv-accent/50 transition-colors"
              />
            )}
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-1 block">Fecha inicio</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => set('startDate', e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white outline-none focus:border-pv-accent/50 transition-colors [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-1 block">Fecha vencimiento</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => set('dueDate', e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white outline-none focus:border-pv-accent/50 transition-colors [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-1 block">Notas</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              placeholder="Observaciones adicionales…"
              className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-pv-gray/50 outline-none focus:border-pv-accent/50 transition-colors resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-[11px] text-pv-red bg-pv-red/10 border border-pv-red/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-1">
            {isEditing && onDeleted && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-2 text-[11px] font-semibold text-pv-red border border-pv-red/30 rounded-lg hover:bg-pv-red/10 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {deleting ? (
                  <>
                    <span className="w-3 h-3 border border-pv-red/40 border-t-pv-red rounded-full animate-spin flex-shrink-0" />
                    Eliminando...
                  </>
                ) : 'Eliminar'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 text-[11px] font-semibold text-pv-gray border border-white/[0.10] rounded-lg hover:bg-white/[0.05] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !form.name.trim()}
              className="flex-1 px-3 py-2 text-[11px] font-semibold text-white bg-pv-accent hover:bg-pv-accent/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin flex-shrink-0" />
                  Guardando...
                </>
              ) : isEditing ? 'Guardar cambios' : 'Crear tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
