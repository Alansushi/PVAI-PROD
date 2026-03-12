'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface UserData {
  id: string
  name: string | null
  email: string | null
  image: string | null
  profession: string | null
  profDetail: string | null
  firmName: string | null
  firmUrl: string | null
  phone: string | null
}

interface Props {
  user: UserData
}

export default function UserProfileEditForm({ user }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: user.name ?? '',
    profession: user.profession ?? '',
    profDetail: user.profDetail ?? '',
    firmName: user.firmName ?? '',
    firmUrl: user.firmUrl ?? '',
    phone: user.phone ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)

  const initials = form.name
    ? form.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : user.email?.[0]?.toUpperCase() ?? '?'

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setToast(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setToast({ type: 'ok', msg: 'Perfil actualizado correctamente.' })
        router.refresh()
      } else {
        setToast({ type: 'err', msg: 'Error al guardar. Intenta de nuevo.' })
      }
    } catch {
      setToast({ type: 'err', msg: 'Error de red.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Avatar */}
      <div className="flex items-center gap-4 mb-1">
        {user.image ? (
          <img
            src={user.image}
            alt={form.name || 'Avatar'}
            className="w-14 h-14 rounded-full border-2 border-white/20"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-pv-accent flex items-center justify-center text-xl font-bold text-white border-2 border-white/20">
            {initials}
          </div>
        )}
        <div>
          <div className="text-[13px] font-semibold text-white">{user.email}</div>
          <div className="text-[10px] text-pv-gray/60 mt-0.5">La foto de perfil se sincroniza con Google.</div>
        </div>
      </div>

      {/* Nombre */}
      <div>
        <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-1 block">
          Nombre completo
        </label>
        <input
          type="text"
          value={form.name}
          onChange={field('name')}
          className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-pv-gray/50 outline-none focus:border-pv-accent/50 transition-colors"
          placeholder="Tu nombre"
        />
      </div>

      {/* Profesión */}
      <div>
        <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-1 block">
          Profesión
        </label>
        <input
          type="text"
          value={form.profession}
          onChange={field('profession')}
          className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-pv-gray/50 outline-none focus:border-pv-accent/50 transition-colors"
          placeholder="Ej. Arquitecto, Diseñador..."
        />
      </div>

      {/* Especialidad */}
      <div>
        <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-1 block">
          Especialidad / Detalle
        </label>
        <input
          type="text"
          value={form.profDetail}
          onChange={field('profDetail')}
          className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-pv-gray/50 outline-none focus:border-pv-accent/50 transition-colors"
          placeholder="Ej. Diseño sustentable, BIM..."
        />
      </div>

      {/* Despacho */}
      <div>
        <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-1 block">
          Nombre del despacho
        </label>
        <input
          type="text"
          value={form.firmName}
          onChange={field('firmName')}
          className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-pv-gray/50 outline-none focus:border-pv-accent/50 transition-colors"
          placeholder="Ej. Studio Vivo"
        />
      </div>

      {/* Web */}
      <div>
        <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-1 block">
          Web del despacho
        </label>
        <input
          type="url"
          value={form.firmUrl}
          onChange={field('firmUrl')}
          className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-pv-gray/50 outline-none focus:border-pv-accent/50 transition-colors"
          placeholder="https://..."
        />
      </div>

      {/* Teléfono */}
      <div>
        <label className="text-[10px] text-pv-gray uppercase tracking-[0.5px] mb-1 block">
          Teléfono
        </label>
        <input
          type="tel"
          value={form.phone}
          onChange={field('phone')}
          className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-pv-gray/50 outline-none focus:border-pv-accent/50 transition-colors"
          placeholder="+52 55 0000 0000"
        />
      </div>

      {/* Toast */}
      {toast && (
        <div className={`text-[11px] px-3 py-2 rounded-lg ${toast.type === 'ok' ? 'bg-pv-green/15 text-pv-green' : 'bg-pv-red/15 text-pv-red'}`}>
          {toast.msg}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 px-3 py-2 text-[11px] font-semibold text-pv-gray border border-white/[0.10] rounded-lg hover:bg-white/[0.05] transition-colors"
        >
          Volver
        </button>
        <button
          type="submit"
          disabled={saving}
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
    </form>
  )
}
