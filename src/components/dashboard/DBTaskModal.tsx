'use client'

import { useState, useEffect } from 'react'
import type { DBDeliverable, DBProjectMember, DBDeliverableDependency } from '@/lib/db-types'
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
  allDeliverables?: { id: string; name: string; status: string }[]
  currentUser?: { id: string; name: string }
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
  allDeliverables = [],
  currentUser,
}: Props) {
  const isEditing = !!editingDeliverable

  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [blockedBy, setBlockedBy] = useState<DBDeliverableDependency[]>([])
  const [addingBlocker, setAddingBlocker] = useState('')
  const [depLoading, setDepLoading] = useState(false)
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
      // Pre-fill responsable with current user when creating
      const currentMember = currentUser
        ? members.find(m => m.userId === currentUser.id) ?? null
        : null
      setSelectedMemberId(currentMember ? currentMember.id : '')
      const now = new Date()
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      setForm({
        name: '',
        status: defaultStatus,
        priority: 'media',
        ownerName: currentUser?.name ?? '',
        startDate: todayStr,
        dueDate: '',
        notes: '',
      })
    }
  }, [editingDeliverable, defaultStatus, open, currentUser, members])

  // Fetch existing dependencies when editing
  useEffect(() => {
    if (open && editingDeliverable) {
      setDepLoading(true)
      fetch(`/api/projects/${projectId}/deliverables/${editingDeliverable.id}/dependencies`)
        .then(r => r.ok ? r.json() : { blockedBy: [] })
        .then(data => setBlockedBy(data.blockedBy ?? []))
        .catch(() => setBlockedBy([]))
        .finally(() => setDepLoading(false))
    } else {
      setBlockedBy([])
      setAddingBlocker('')
    }
  }, [open, editingDeliverable, projectId])

  if (!open) return null

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleDuplicate() {
    if (!editingDeliverable) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/deliverables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Copia de ${editingDeliverable.name}`,
          status: form.status,
          priority: form.priority,
          notes: form.notes || null,
          ownerName: form.ownerName || null,
          ownerId: editingDeliverable.ownerId || undefined,
          startDate: form.startDate || null,
          dueDate: form.dueDate || null,
        }),
      })
      if (res.ok) {
        const dup = await res.json()
        if (dup.dueDate) dup.dueDate = new Date(dup.dueDate)
        if (dup.startDate) dup.startDate = new Date(dup.startDate)
        if (dup.createdAt) dup.createdAt = new Date(dup.createdAt)
        if (dup.updatedAt) dup.updatedAt = new Date(dup.updatedAt)
        onSaved(dup as DBDeliverable)
        onClose()
      } else {
        setError('No se pudo duplicar. Intenta de nuevo.')
      }
    } catch {
      setError('No se pudo duplicar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
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

  async function handleAddBlocker() {
    if (!editingDeliverable || !addingBlocker) return
    try {
      const res = await fetch(
        `/api/projects/${projectId}/deliverables/${editingDeliverable.id}/dependencies`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blockerId: addingBlocker }) },
      )
      if (res.ok) {
        const dep = await res.json()
        setBlockedBy(prev => [...prev, dep])
        setAddingBlocker('')
      }
    } catch { /* silent */ }
  }

  async function handleRemoveBlocker(blockerId: string) {
    if (!editingDeliverable) return
    try {
      await fetch(
        `/api/projects/${projectId}/deliverables/${editingDeliverable.id}/dependencies`,
        { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blockerId }) },
      )
      setBlockedBy(prev => prev.filter(d => d.blockerId !== blockerId))
    } catch { /* silent */ }
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

          {/* Dependencies (only in edit mode) */}
          {isEditing && (
            <div>
              <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-1.5 block">
                Bloqueado por
              </label>
              {depLoading ? (
                <div className="h-6 bg-white/[0.04] rounded animate-pulse" />
              ) : (
                <div className="flex flex-col gap-1.5">
                  {blockedBy.map(dep => (
                    <div key={dep.blockerId} className="flex items-center gap-2 bg-white/[0.04] rounded-lg px-2.5 py-1.5">
                      {dep.blocker?.status === 'danger' && (
                        <span className="text-pv-red text-[11px]">⚠</span>
                      )}
                      <span className={`text-[11px] flex-1 truncate ${dep.blocker?.status === 'danger' ? 'text-pv-red' : 'text-white/80'}`}>
                        {dep.blocker?.name ?? dep.blockerId}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBlocker(dep.blockerId)}
                        className="text-pv-gray/60 hover:text-pv-red text-[13px] leading-none transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {allDeliverables.filter(
                    d => d.id !== editingDeliverable?.id && !blockedBy.some(b => b.blockerId === d.id)
                  ).length > 0 && (
                    <div className="flex gap-2">
                      <select
                        value={addingBlocker}
                        onChange={e => setAddingBlocker(e.target.value)}
                        className="flex-1 bg-[#0C1F35] border border-white/[0.10] rounded-lg px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-pv-accent/50 transition-colors"
                        style={{ colorScheme: 'dark' }}
                      >
                        <option value="">Agregar bloqueador…</option>
                        {allDeliverables
                          .filter(d => d.id !== editingDeliverable?.id && !blockedBy.some(b => b.blockerId === d.id))
                          .map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                      </select>
                      {addingBlocker && (
                        <button
                          type="button"
                          onClick={handleAddBlocker}
                          className="px-2.5 py-1.5 text-[11px] font-semibold text-pv-accent border border-pv-accent/30 rounded-lg hover:bg-pv-accent/10 transition-colors"
                        >
                          Agregar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-[11px] text-pv-red bg-pv-red/10 border border-pv-red/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-1">
            {isEditing && (
              <button
                type="button"
                onClick={handleDuplicate}
                disabled={loading || deleting}
                className="px-3 py-2 text-[11px] font-semibold text-pv-accent border border-pv-accent/30 rounded-lg hover:bg-pv-accent/10 transition-colors disabled:opacity-50"
              >
                Duplicar
              </button>
            )}
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
