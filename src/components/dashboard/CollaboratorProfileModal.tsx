'use client'

import { useState, useEffect } from 'react'
import type { DBProjectMember, DBDeliverable } from '@/lib/db-types'

const MEMBER_COLORS = [
  '#2E8FC0',
  '#2A9B6F',
  '#7C5CBF',
  '#E09B3D',
  '#1DA6A0',
  '#D94F4F',
  '#E07B54',
  '#5B8DB8',
]

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

interface Props {
  open: boolean
  onClose: () => void
  member: DBProjectMember | null
  deliverables: DBDeliverable[]
  projectId: string
  projectTitle: string
  onUpdated: (member: DBProjectMember) => void
  onRemoved: (memberId: string) => void
}

type Mode = 'view' | 'edit' | 'confirm-delete'

export default function CollaboratorProfileModal({
  open,
  onClose,
  member,
  deliverables,
  projectId,
  projectTitle,
  onUpdated,
  onRemoved,
}: Props) {
  const [mode, setMode] = useState<Mode>('view')
  const [editForm, setEditForm] = useState({ name: '', role: '', color: MEMBER_COLORS[0] })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (member) {
      setEditForm({ name: member.name, role: member.role, color: member.color })
      setMode('view')
    }
  }, [member])

  if (!open || !member) return null

  // Stats
  const memberDeliverables = deliverables.filter(
    d => d.ownerName === member.name
  )
  const totalTasks = memberDeliverables.length
  const doneTasks = memberDeliverables.filter(d => d.status === 'ok').length
  const hasRisk = memberDeliverables.some(d => d.status === 'danger')

  const memberStatus =
    totalTasks === 0
      ? { label: 'Sin tareas', cls: 'text-pv-gray', bg: 'bg-white/[0.06]' }
      : doneTasks === totalTasks
      ? { label: 'Al corriente', cls: 'text-pv-green', bg: 'bg-pv-green/15' }
      : hasRisk
      ? { label: 'En riesgo', cls: 'text-pv-red', bg: 'bg-pv-red/15' }
      : { label: 'En proceso', cls: 'text-pv-amber', bg: 'bg-pv-amber/15' }

  // Active deliverables: not-ok first; fallback to all if all ok
  const activeDeliverables =
    memberDeliverables.filter(d => d.status !== 'ok').length > 0
      ? memberDeliverables.filter(d => d.status !== 'ok')
      : memberDeliverables

  const STATUS_LABEL: Record<string, string> = {
    ok: 'Completado',
    warn: 'En curso',
    danger: 'En riesgo',
  }
  const STATUS_CLS: Record<string, string> = {
    ok: 'text-pv-green',
    warn: 'text-pv-amber',
    danger: 'text-pv-red',
  }

  async function handleSave() {
    if (!editForm.name.trim() || !editForm.role.trim()) return
    setSaving(true)
    try {
      const initials = computeInitials(editForm.name)
      const res = await fetch(`/api/projects/${projectId}/members/${member!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name.trim(),
          initials,
          color: editForm.color,
          role: editForm.role.trim(),
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        onUpdated(updated as DBProjectMember)
        setMode('view')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/members/${member!.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        onRemoved(member!.id)
        onClose()
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 bg-[#0C1F35] border border-white/[0.10] rounded-2xl p-6 w-[420px] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <h2 className="font-display text-[17px] font-bold text-white">
            {mode === 'edit' ? 'Editar colaborador' : mode === 'confirm-delete' ? 'Eliminar colaborador' : 'Perfil del colaborador'}
          </h2>
          <button
            onClick={onClose}
            className="text-pv-gray hover:text-white text-lg leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* ── VIEW MODE ── */}
        {mode === 'view' && (
          <>
            {/* Avatar + name */}
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-bold text-white flex-shrink-0"
                style={{ background: member.color }}
              >
                {member.initials}
              </div>
              <div>
                <div className="text-[15px] font-semibold text-white leading-tight">{member.name}</div>
                <div className="text-[11px] text-pv-gray mt-0.5">{member.role}</div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 flex flex-col gap-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-pv-gray">Tareas asignadas</span>
                <span className="text-[13px] font-bold text-white">{totalTasks}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-pv-gray">Completadas</span>
                <span className="text-[12px] font-semibold text-pv-green">
                  {doneTasks} de {totalTasks}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-pv-gray">Estado</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${memberStatus.bg} ${memberStatus.cls}`}>
                  {memberStatus.label}
                </span>
              </div>
            </div>

            {/* Active deliverables */}
            {activeDeliverables.length > 0 && (
              <div className="mb-5">
                <div className="text-[9px] text-pv-gray uppercase tracking-[0.5px] mb-2">
                  Entregables activos
                </div>
                <div className="flex flex-col gap-1.5 max-h-[150px] overflow-y-auto pr-1">
                  {activeDeliverables.map(d => (
                    <div
                      key={d.id}
                      className="bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2"
                    >
                      <div className="text-[11px] font-semibold text-white leading-snug">{d.name}</div>
                      <div className="text-[9px] mt-0.5 flex items-center gap-1">
                        <span className={STATUS_CLS[d.status] ?? 'text-pv-gray'}>
                          {STATUS_LABEL[d.status] ?? d.status}
                        </span>
                        <span className="text-pv-gray/40">·</span>
                        <span className="text-pv-gray">{projectTitle}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setMode('edit')}
                className="flex-1 px-3 py-2 text-[11px] font-semibold text-pv-accent border border-pv-accent/30 rounded-lg hover:bg-pv-accent/10 transition-colors"
              >
                Editar
              </button>
              <button
                onClick={() => setMode('confirm-delete')}
                className="flex-1 px-3 py-2 text-[11px] font-semibold text-pv-red border border-pv-red/30 rounded-lg hover:bg-pv-red/10 transition-colors"
              >
                Eliminar del proyecto
              </button>
            </div>
          </>
        )}

        {/* ── EDIT MODE ── */}
        {mode === 'edit' && (
          <div className="flex flex-col gap-3.5">
            {/* Nombre */}
            <div>
              <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-1 block">
                Nombre completo *
              </label>
              <input
                type="text"
                required
                disabled={!!member.userId}
                value={editForm.name}
                onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-pv-gray/50 outline-none focus:border-pv-accent/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {member.userId && (
                <p className="text-[9px] text-pv-gray/60 mt-1">
                  El nombre se actualiza desde Mi perfil.
                </p>
              )}
            </div>

            {/* Rol */}
            <div>
              <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-1 block">
                Rol *
              </label>
              <input
                type="text"
                required
                value={editForm.role}
                onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}
                className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-pv-gray/50 outline-none focus:border-pv-accent/50 transition-colors"
              />
            </div>

            {/* Color */}
            <div>
              <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-2 block">
                Color de avatar
              </label>
              <div className="flex gap-2 flex-wrap">
                {MEMBER_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditForm(p => ({ ...p, color: c }))}
                    className="w-7 h-7 rounded-full transition-all hover:scale-110"
                    style={{
                      background: c,
                      outline: editForm.color === c ? '3px solid white' : 'none',
                      outlineOffset: '2px',
                    }}
                    title={c}
                  />
                ))}
              </div>
              {editForm.name && (
                <div className="mt-2.5 flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                    style={{ background: editForm.color }}
                  >
                    {computeInitials(editForm.name)}
                  </div>
                  <span className="text-[11px] text-pv-gray">
                    {editForm.name}{editForm.role ? ` — ${editForm.role}` : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setMode('view')}
                className="flex-1 px-3 py-2 text-[11px] font-semibold text-pv-gray border border-white/[0.10] rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !editForm.name.trim() || !editForm.role.trim()}
                className="flex-1 px-3 py-2 text-[11px] font-semibold text-white bg-pv-accent hover:bg-pv-accent/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {saving ? (
                  <>
                    <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin flex-shrink-0" />
                    Guardando...
                  </>
                ) : 'Guardar cambios'}
              </button>
            </div>
          </div>
        )}

        {/* ── CONFIRM DELETE MODE ── */}
        {mode === 'confirm-delete' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 p-3 bg-pv-red/10 border border-pv-red/20 rounded-xl">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0"
                style={{ background: member.color }}
              >
                {member.initials}
              </div>
              <div>
                <div className="text-[13px] font-semibold text-white">{member.name}</div>
                <div className="text-[10px] text-pv-gray">{member.role}</div>
              </div>
            </div>
            <p className="text-[12px] text-pv-gray leading-relaxed">
              ¿Eliminar a <span className="text-white font-semibold">{member.name}</span> del proyecto <span className="text-white font-semibold">{projectTitle}</span>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setMode('view')}
                className="flex-1 px-3 py-2 text-[11px] font-semibold text-pv-gray border border-white/[0.10] rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="flex-1 px-3 py-2 text-[11px] font-semibold text-white bg-pv-red hover:bg-pv-red/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {saving ? (
                  <>
                    <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin flex-shrink-0" />
                    Eliminando...
                  </>
                ) : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
