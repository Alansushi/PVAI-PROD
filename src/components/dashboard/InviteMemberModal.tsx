'use client'

import { useState, useEffect, useRef } from 'react'
import type { DBProjectMember } from '@/lib/db-types'

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

interface FoundUser {
  id: string
  name: string
  email: string
  image?: string | null
}

interface Props {
  open: boolean
  onClose: () => void
  projectId: string
  onAdded: (member: DBProjectMember) => void
}

export default function InviteMemberModal({ open, onClose, projectId, onAdded }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null)
  const [lookingUp, setLookingUp] = useState(false)
  const [form, setForm] = useState({
    name: '',
    role: '',
    email: '',
    color: MEMBER_COLORS[0],
  })
  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setError(null)
    setFoundUser(null)
  }, [open])

  if (!open) return null

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (key === 'email') {
      // Debounced lookup
      if (lookupTimer.current) clearTimeout(lookupTimer.current)
      setFoundUser(null)
      if (value.includes('@') && value.includes('.')) {
        setLookingUp(true)
        lookupTimer.current = setTimeout(async () => {
          try {
            const res = await fetch(`/api/users/lookup?email=${encodeURIComponent(value)}`)
            if (res.ok) {
              const user = await res.json()
              setFoundUser(user ?? null)
              if (user) {
                setForm(prev => ({ ...prev, name: user.name ?? prev.name }))
              }
            }
          } finally {
            setLookingUp(false)
          }
        }, 500)
      } else {
        setLookingUp(false)
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.role.trim()) return
    setLoading(true)
    setError(null)
    try {
      const initials = computeInitials(form.name)
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          initials,
          color: form.color,
          role: form.role.trim(),
          isExternal: !foundUser && !!form.email,
          notifyEmail: form.email.trim() || undefined,
          userId: foundUser?.id ?? undefined,
        }),
      })
      if (res.ok) {
        const saved = await res.json()
        onAdded(saved as DBProjectMember)
        setForm({ name: '', role: '', email: '', color: MEMBER_COLORS[0] })
        setFoundUser(null)
        onClose()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'No se pudo agregar. Intenta de nuevo.')
      }
    } catch {
      setError('No se pudo agregar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 bg-[#0C1F35] border border-white/[0.10] rounded-2xl p-6 w-[400px] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-[17px] font-bold text-white mb-5">Agregar colaborador</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Email (first — drives lookup) */}
          <div>
            <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-1 block">
              Email <span className="text-pv-gray/60 normal-case">(opcional — para notificar e identificar)</span>
            </label>
            <div className="relative">
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="ana@ejemplo.com"
                className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-pv-gray/50 outline-none focus:border-pv-accent/50 transition-colors"
              />
              {lookingUp && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 border border-pv-accent/40 border-t-pv-accent rounded-full animate-spin" />
              )}
            </div>
            {/* Found user chip */}
            {foundUser && (
              <div className="flex items-center gap-2 mt-1.5 px-3 py-2 bg-pv-accent/10 border border-pv-accent/30 rounded-lg">
                {foundUser.image && (
                  <img src={foundUser.image} className="w-6 h-6 rounded-full flex-shrink-0" alt="" />
                )}
                <span className="text-[12px] text-white">{foundUser.name}</span>
                <span className="text-[9px] font-bold text-pv-accent ml-auto flex-shrink-0">Cuenta registrada ✓</span>
              </div>
            )}
          </div>

          {/* Nombre */}
          <div>
            <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-1 block">
              Nombre completo *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              disabled={!!foundUser}
              placeholder="Ana Torres"
              className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-pv-gray/50 outline-none focus:border-pv-accent/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Rol */}
          <div>
            <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-1 block">
              Rol *
            </label>
            <input
              type="text"
              required
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
              placeholder="Arquitecta"
              className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-pv-gray/50 outline-none focus:border-pv-accent/50 transition-colors"
            />
          </div>

          {/* Color */}
          <div>
            <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-2 block">
              Color de avatar
            </label>
            <div className="flex gap-2 flex-wrap">
              {MEMBER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('color', c)}
                  className="w-7 h-7 rounded-full transition-all hover:scale-110 flex items-center justify-center"
                  style={{ background: c, outline: form.color === c ? `3px solid white` : 'none', outlineOffset: '2px' }}
                  title={c}
                />
              ))}
            </div>
            {/* Preview */}
            {form.name && (
              <div className="mt-2.5 flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                  style={{ background: form.color }}
                >
                  {computeInitials(form.name)}
                </div>
                <span className="text-[11px] text-pv-gray">{form.name}{form.role ? ` — ${form.role}` : ''}</span>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="text-[11px] text-pv-red bg-pv-red/10 border border-pv-red/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 text-[11px] font-semibold text-pv-gray border border-white/[0.10] rounded-lg hover:bg-white/[0.05] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !form.name.trim() || !form.role.trim()}
              className="flex-1 px-3 py-2 text-[11px] font-semibold text-white bg-pv-accent hover:bg-pv-accent/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin flex-shrink-0" />
                  Guardando...
                </>
              ) : 'Agregar al proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
